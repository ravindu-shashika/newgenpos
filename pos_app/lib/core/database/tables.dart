import 'package:drift/drift.dart';

class Warehouses extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get phone => text().nullable()();
  TextColumn get email => text().nullable()();
  TextColumn get address => text().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalUsers extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get username => text().nullable()();
  TextColumn get email => text().nullable()();
  TextColumn get passwordHash => text()();
  TextColumn get accessPinHash => text().nullable()();
  IntColumn get warehouseId => integer().nullable()();
  IntColumn get roleId => integer().nullable()();
  IntColumn get billerId => integer().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// Single-row device registration, tokens, and logged-in user (id always 1).
class DeviceSession extends Table {
  IntColumn get id => integer().withDefault(const Constant(1))();
  TextColumn get authToken => text().nullable()();
  TextColumn get deviceId => text().nullable()();
  IntColumn get warehouseId => integer().nullable()();
  IntColumn get customerId => integer().nullable()();
  IntColumn get billerId => integer().nullable()();
  TextColumn get userName => text().nullable()();
  IntColumn get userId => integer().nullable()();
  BoolColumn get isProvisioned =>
      boolean().withDefault(const Constant(false))();
  IntColumn get terminalId => integer().nullable()();
  TextColumn get terminalCode => text().nullable()();
  TextColumn get terminalName => text().nullable()();
  TextColumn get posToken => text().nullable()();
  TextColumn get clientToken => text().nullable()();
  TextColumn get activationToken => text().nullable()();
  TextColumn get macAddress => text().nullable()();
  TextColumn get posBaseUrl => text().nullable()();
  BoolColumn get deviceRegistered =>
      boolean().withDefault(const Constant(false))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class SyncMeta extends Table {
  IntColumn get id => integer().withDefault(const Constant(1))();
  TextColumn get deviceId => text()();
  IntColumn get warehouseId => integer()();
  TextColumn get lastCatalogSyncAt => text().nullable()();
  TextColumn get lastFullDownloadAt => text().nullable()();
  IntColumn get defaultCustomerId => integer().nullable()();
  IntColumn get defaultBillerId => integer().nullable()();
  TextColumn get posSettingsJson => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Categories extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get image => text().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Brands extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get image => text().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Taxes extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  RealColumn get rate => real().withDefault(const Constant(0))();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Units extends Table {
  IntColumn get id => integer()();
  TextColumn get unitCode => text().nullable()();
  TextColumn get unitName => text()();
  IntColumn get baseUnit => integer().nullable()();
  TextColumn get operator => text().nullable()();
  RealColumn get operationValue => real().withDefault(const Constant(1))();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Customers extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get phoneNumber => text().nullable()();
  TextColumn get email => text().nullable()();
  TextColumn get city => text().nullable()();
  IntColumn get customerGroupId => integer().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalCoupons extends Table {
  IntColumn get id => integer()();
  TextColumn get code => text()();
  TextColumn get type => text().withDefault(const Constant('percentage'))();
  RealColumn get amount => real().withDefault(const Constant(0))();
  RealColumn get minimumAmount => real().withDefault(const Constant(0))();
  RealColumn get quantity => real().nullable()();
  RealColumn get used => real().withDefault(const Constant(0))();
  TextColumn get expiredDate => text().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Billers extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get companyName => text().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Products extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get code => text()();
  TextColumn get type => text().withDefault(const Constant('standard'))();
  IntColumn get brandId => integer().nullable()();
  IntColumn get categoryId => integer().nullable()();
  IntColumn get unitId => integer().nullable()();
  IntColumn get saleUnitId => integer().nullable()();
  RealColumn get cost => real().withDefault(const Constant(0))();
  RealColumn get price => real().withDefault(const Constant(0))();
  RealColumn get wholesalePrice => real().withDefault(const Constant(0))();
  IntColumn get taxId => integer().nullable()();
  IntColumn get taxMethod => integer().withDefault(const Constant(1))();
  TextColumn get image => text().nullable()();
  BoolColumn get isVariant => boolean().withDefault(const Constant(false))();
  BoolColumn get isBatch => boolean().withDefault(const Constant(false))();
  BoolColumn get isImei => boolean().withDefault(const Constant(false))();
  BoolColumn get isEmbeded => boolean().withDefault(const Constant(false))();
  IntColumn get featured => integer().withDefault(const Constant(0))();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class ProductVariants extends Table {
  IntColumn get id => integer()();
  IntColumn get productId => integer()();
  IntColumn get variantId => integer().nullable()();
  TextColumn get itemCode => text()();
  RealColumn get additionalPrice => real().withDefault(const Constant(0))();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class ProductStock extends Table {
  IntColumn get id => integer()();
  IntColumn get productId => integer()();
  IntColumn get warehouseId => integer()();
  IntColumn get variantId => integer().nullable()();
  RealColumn get qty => real().withDefault(const Constant(0))();
  RealColumn get price => real().nullable()();
  IntColumn get productBatchId => integer().nullable()();
  TextColumn get imeiNumber => text().nullable()();
  TextColumn get updatedAt => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalSales extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get clientUuid => text().unique()();
  IntColumn get warehouseId => integer()();
  IntColumn get customerId => integer()();
  IntColumn get billerId => integer().nullable()();
  TextColumn get referenceNo => text().nullable()();
  IntColumn get itemCount => integer().withDefault(const Constant(0))();
  RealColumn get totalQty => real().withDefault(const Constant(0))();
  RealColumn get totalDiscount => real().withDefault(const Constant(0))();
  RealColumn get totalTax => real().withDefault(const Constant(0))();
  RealColumn get grandTotal => real()();
  RealColumn get paidAmount => real().withDefault(const Constant(0))();
  IntColumn get saleStatus => integer().withDefault(const Constant(1))();
  IntColumn get paymentStatus => integer().withDefault(const Constant(4))();
  RealColumn get orderTaxRate => real().withDefault(const Constant(0))();
  RealColumn get orderDiscount => real().withDefault(const Constant(0))();
  RealColumn get shippingCost => real().withDefault(const Constant(0))();
  IntColumn get couponId => integer().nullable()();
  BoolColumn get couponActive => boolean().withDefault(const Constant(false))();
  TextColumn get payloadJson => text().nullable()();
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  IntColumn get serverSaleId => integer().nullable()();
  TextColumn get serverReferenceNo => text().nullable()();
  TextColumn get errorMessage => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get syncedAt => dateTime().nullable()();
}

class LocalReturns extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get clientUuid => text().unique()();
  IntColumn get saleId => integer().nullable()();
  TextColumn get saleReferenceNo => text()();
  IntColumn get warehouseId => integer()();
  IntColumn get customerId => integer()();
  TextColumn get referenceNo => text().nullable()();
  RealColumn get grandTotal => real()();
  RealColumn get settledAmount => real().withDefault(const Constant(0))();
  TextColumn get payloadJson => text()();
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  IntColumn get serverReturnId => integer().nullable()();
  TextColumn get serverReferenceNo => text().nullable()();
  TextColumn get errorMessage => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get syncedAt => dateTime().nullable()();
}

class LocalExchanges extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get clientUuid => text().unique()();
  IntColumn get saleId => integer().nullable()();
  TextColumn get saleReferenceNo => text()();
  IntColumn get warehouseId => integer()();
  IntColumn get customerId => integer()();
  TextColumn get referenceNo => text().nullable()();
  RealColumn get balance => real()();
  TextColumn get paymentType => text().nullable()();
  TextColumn get payloadJson => text()();
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  IntColumn get serverExchangeId => integer().nullable()();
  TextColumn get serverReferenceNo => text().nullable()();
  TextColumn get errorMessage => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get syncedAt => dateTime().nullable()();
}

class LocalSaleLines extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get localSaleId => integer().references(LocalSales, #id)();
  IntColumn get productId => integer()();
  IntColumn get variantId => integer().nullable()();
  IntColumn get productBatchId => integer().nullable()();
  TextColumn get code => text().nullable()();
  TextColumn get name => text().nullable()();
  RealColumn get qty => real()();
  RealColumn get netUnitPrice => real()();
  RealColumn get discount => real().withDefault(const Constant(0))();
  RealColumn get taxRate => real().withDefault(const Constant(0))();
  RealColumn get tax => real().withDefault(const Constant(0))();
  RealColumn get total => real()();
  TextColumn get saleUnit => text().withDefault(const Constant('pc'))();
  TextColumn get imeiNumber => text().nullable()();
}
