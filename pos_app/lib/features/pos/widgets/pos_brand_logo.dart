import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../core/branding/pos_branding.dart';
import '../../../core/theme/pos_theme.dart';

enum PosBrandLogoVariant {
  sidebar,
  light,
}

/// Logo image from print setup, or branded initial fallback.
class PosBrandLogo extends StatelessWidget {
  const PosBrandLogo({
    super.key,
    this.logoPath,
    this.size = 48,
    this.variant = PosBrandLogoVariant.sidebar,
  });

  final String? logoPath;
  final double size;
  final PosBrandLogoVariant variant;

  @override
  Widget build(BuildContext context) {
    final path = logoPath?.trim();
    if (!kIsWeb && path != null && path.isNotEmpty) {
      final file = File(path);
      if (file.existsSync()) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.file(
            file,
            width: size,
            height: size,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => _fallback(),
          ),
        );
      }
    }
    return _fallback();
  }

  Widget _fallback() {
    final isSidebar = variant == PosBrandLogoVariant.sidebar;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isSidebar
            ? Colors.white.withValues(alpha: 0.18)
            : PosColors.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSidebar ? Colors.white24 : PosColors.primary.withValues(alpha: 0.35),
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        PosBranding.fallbackInitial,
        style: TextStyle(
          color: isSidebar ? Colors.white : PosColors.primary,
          fontSize: size * 0.42,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// Branded header with logo and app name (login / setup screens).
class PosBrandHeader extends StatelessWidget {
  const PosBrandHeader({
    super.key,
    this.logoPath,
    this.logoSize = 72,
  });

  final String? logoPath;
  final double logoSize;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PosBrandLogo(
          logoPath: logoPath,
          size: logoSize,
          variant: PosBrandLogoVariant.light,
        ),
        const SizedBox(height: 14),
        Text(
          PosBranding.appName,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
