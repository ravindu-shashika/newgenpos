enum PosDownloadMode { full, delta }

class DownloadProgressInfo {
  const DownloadProgressInfo({
    required this.resource,
    required this.page,
    required this.totalPages,
    required this.completedChunks,
    required this.totalChunks,
    required this.rowsThisChunk,
    this.overallPercent = 0,
  });

  final String resource;
  final int page;
  final int totalPages;
  final int completedChunks;
  final int totalChunks;
  final int rowsThisChunk;
  final double overallPercent;
}

typedef DownloadProgressCallback = void Function(DownloadProgressInfo info);
