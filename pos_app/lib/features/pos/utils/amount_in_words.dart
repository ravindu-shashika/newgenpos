/// Simple amount-in-words for receipt footer (English).
String amountInWords(double amount) {
  final whole = amount.floor();
  final cents = ((amount - whole) * 100).round();
  if (whole == 0 && cents == 0) return 'Zero only';
  final words = _numberToWords(whole);
  if (cents > 0) {
    return '$words and ${cents.toString().padLeft(2, '0')}/100 only';
  }
  return '$words only';
}

String _numberToWords(int n) {
  if (n == 0) return 'Zero';
  if (n < 0) return 'Minus ${_numberToWords(-n)}';

  const units = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  if (n < 20) return units[n];
  if (n < 100) {
    final t = tens[n ~/ 10];
    final u = n % 10;
    return u == 0 ? t : '$t ${units[u]}';
  }
  if (n < 1000) {
    final h = n ~/ 100;
    final r = n % 100;
    return r == 0
        ? '${units[h]} Hundred'
        : '${units[h]} Hundred ${_numberToWords(r)}';
  }
  if (n < 1000000) {
    final th = n ~/ 1000;
    final r = n % 1000;
    return r == 0
        ? '${_numberToWords(th)} Thousand'
        : '${_numberToWords(th)} Thousand ${_numberToWords(r)}';
  }
  final m = n ~/ 1000000;
  final r = n % 1000000;
  return r == 0
      ? '${_numberToWords(m)} Million'
      : '${_numberToWords(m)} Million ${_numberToWords(r)}';
}
