import '../../core/config/app_config.dart';

const _defaultProductImage = 'zummXD2dvAtI.png';

String _imageRoot([String? storedPosBaseUrl]) {
  var root = AppConfig.resolvePosBaseUrl(storedPosBaseUrl);
  if (root.endsWith('/pos')) {
    root = root.substring(0, root.length - 4);
  }
  return root;
}

/// Build a small product thumbnail URL from synced DB image filename(s).
String? resolveProductImageUrl(String? rawImage, {String? posBaseUrl}) {
  if (rawImage == null) return null;
  final first = rawImage.split(',').first.trim();
  if (first.isEmpty || first == _defaultProductImage) return null;
  if (first.startsWith('http://') || first.startsWith('https://')) {
    return first;
  }

  return '${_imageRoot(posBaseUrl)}/images/product/small/$first';
}
