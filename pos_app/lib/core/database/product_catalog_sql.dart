/// Raw SQL for large-catalog product grid and FTS search (1M+ SKUs).
class ProductCatalogSql {
  ProductCatalogSql._();

  static const stockAggregateCte = '''
WITH stock_agg AS (
  SELECT
    ps.product_id AS product_id,
    CASE WHEN ps.variant_id IS NULL THEN 0 ELSE ps.variant_id END AS variant_id,
    SUM(
      CASE
        WHEN p.is_batch = 1 AND ps.variant_id IS NULL THEN
          CASE WHEN ps.product_batch_id IS NOT NULL THEN ps.qty ELSE 0 END
        WHEN p.is_batch = 0 AND ps.variant_id IS NULL AND ps.product_batch_id IS NOT NULL THEN 0
        WHEN p.is_batch = 0 AND ps.variant_id IS NULL AND ps.product_batch_id IS NULL THEN ps.qty
        WHEN ps.variant_id IS NOT NULL THEN ps.qty
        ELSE 0
      END
    ) AS qty
  FROM product_stock ps
  INNER JOIN products p ON p.id = ps.product_id
  LEFT JOIN product_batches pb ON pb.id = ps.product_batch_id
  WHERE ps.warehouse_id = ?
    AND (
      ps.product_batch_id IS NULL
      OR pb.expired_date IS NULL
      OR TRIM(pb.expired_date) = ''
      OR DATE(pb.expired_date) >= DATE('now', 'localtime')
    )
  GROUP BY ps.product_id, CASE WHEN ps.variant_id IS NULL THEN 0 ELSE ps.variant_id END
)
''';

  static String gridPageSql(String productFilterSql) => '''
$stockAggregateCte
SELECT
  sa.product_id,
  sa.variant_id,
  sa.qty,
  p.name,
  p.code,
  p.alt_code,
  p.price,
  p.wholesale_price,
  p.max_price,
  p.tax_id,
  p.tax_method,
  p.image,
  p.is_batch
FROM stock_agg sa
INNER JOIN products p ON p.id = sa.product_id
WHERE sa.qty > 0 $productFilterSql
ORDER BY p.name COLLATE NOCASE ASC, sa.variant_id ASC
LIMIT ? OFFSET ?
''';

  static String gridCountSql(String productFilterSql) => '''
$stockAggregateCte
SELECT COUNT(*) AS cnt
FROM stock_agg sa
INNER JOIN products p ON p.id = sa.product_id
WHERE sa.qty > 0 $productFilterSql
''';

  static String filterClause({
    required bool featured,
    required bool category,
    required bool brand,
  }) {
    if (featured) return 'AND p.featured = 1';
    if (category) return 'AND p.category_id = ?';
    if (brand) return 'AND p.brand_id = ?';
    return '';
  }

  /// Builds an FTS5 MATCH expression with prefix tokens (fast on large catalogs).
  static String? ftsMatchExpression(String rawQuery) {
    final tokens = rawQuery
        .trim()
        .toLowerCase()
        .split(RegExp(r'\s+'))
        .map((t) => t.replaceAll(RegExp(r'''["'*\-]'''), ''))
        .where((t) => t.length >= 2)
        .toList();
    if (tokens.isEmpty) return null;
    return tokens.map((t) => '"$t"*').join(' AND ');
  }

  static const ftsSearchSql = '''
SELECT product_id
FROM products_fts
WHERE products_fts MATCH ?
ORDER BY bm25(products_fts)
LIMIT ?
''';

  static const rebuildFtsSql = '''
INSERT INTO products_fts(rowid, product_id, name, code, alt_code)
SELECT id, id, name, code, COALESCE(alt_code, '')
FROM products
''';

  static const upsertFtsRowSql = '''
INSERT OR REPLACE INTO products_fts(rowid, product_id, name, code, alt_code)
VALUES (?, ?, ?, ?, ?)
''';

  static String inventoryQtyCte({required bool warehouseScoped}) => '''
WITH product_qty AS (
  SELECT
    ps.product_id AS product_id,
    SUM(ps.qty) AS qty
  FROM product_stock ps
  ${warehouseScoped ? 'WHERE ps.warehouse_id = ?' : ''}
  GROUP BY ps.product_id
)
''';

  static String inventorySummarySql({required bool warehouseScoped}) => '''
${inventoryQtyCte(warehouseScoped: warehouseScoped)}
SELECT
  COUNT(p.id) AS total_items,
  SUM(
    CASE
      WHEN COALESCE(pq.qty, 0) <= 0
        OR (
          COALESCE(pq.qty, 0) > 0 AND COALESCE(pq.qty, 0) <= ?
        ) THEN 1
      ELSE 0
    END
  ) AS low_stock_count,
  SUM(CASE WHEN COALESCE(pq.qty, 0) > ? THEN 1 ELSE 0 END) AS in_stock_count,
  SUM(
    CASE
      WHEN p.updated_at IS NOT NULL AND TRIM(p.updated_at) != '' THEN 1
      ELSE 0
    END
  ) AS recent_update_count
FROM products p
LEFT JOIN product_qty pq ON pq.product_id = p.id
''';

  static String inventoryPageSql({
    required bool warehouseScoped,
    required String searchFilterSql,
  }) =>
      '''
${inventoryQtyCte(warehouseScoped: warehouseScoped)}
SELECT
  p.id AS product_id,
  p.name AS name,
  p.code AS code,
  p.price AS price,
  COALESCE(c.name, '—') AS category_name,
  COALESCE(pq.qty, 0) AS qty,
  CASE
    WHEN COALESCE(pq.qty, 0) <= 0 THEN 0
    WHEN COALESCE(pq.qty, 0) <= ? THEN 1
    ELSE 2
  END AS status_rank
FROM products p
LEFT JOIN product_qty pq ON pq.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
WHERE 1=1 $searchFilterSql
ORDER BY status_rank ASC, p.name COLLATE NOCASE ASC
LIMIT ? OFFSET ?
''';

  static String inventoryCountSql({
    required bool warehouseScoped,
    required String searchFilterSql,
  }) =>
      '''
${inventoryQtyCte(warehouseScoped: warehouseScoped)}
SELECT COUNT(p.id) AS cnt
FROM products p
LEFT JOIN product_qty pq ON pq.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
WHERE 1=1 $searchFilterSql
''';

  static const inventoryCategorySearchSql = '''
SELECT p.id AS product_id
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE LOWER(c.name) LIKE '%' || LOWER(?) || '%'
LIMIT ?
''';

  static const inventoryCodePrefixSql = '''
SELECT id AS product_id
FROM products
WHERE code LIKE ? OR alt_code LIKE ?
LIMIT ?
''';
}
