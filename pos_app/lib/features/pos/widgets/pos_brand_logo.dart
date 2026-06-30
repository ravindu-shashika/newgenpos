import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../core/branding/pos_branding.dart';
import '../../../core/theme/pos_theme.dart';

enum PosBrandLogoVariant {
  /// Top of the navy / brand-colored navigation rail.
  sidebar,
  /// Login, settings cards, and other page surfaces.
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

  bool get _isSidebar => variant == PosBrandLogoVariant.sidebar;

  @override
  Widget build(BuildContext context) {
    final file = _resolveImageFile();

    if (file != null) {
      return _LogoFrame(
        size: size,
        variant: variant,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: Image.file(
            file,
            width: size,
            height: size,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => _fallbackContent(context),
          ),
        ),
      );
    }
    return _fallback(context);
  }

  File? _resolveImageFile() {
    if (kIsWeb) return null;
    final path = logoPath?.trim();
    if (path == null || path.isEmpty) return null;
    final file = File(path);
    return file.existsSync() ? file : null;
  }

  Widget _fallback(BuildContext context) {
    return _LogoFrame(
      size: size,
      variant: variant,
      child: _fallbackContent(context),
    );
  }

  Widget _fallbackContent(BuildContext context) {
    final brand = context.posBrand;
    final isDark = context.isPosDark;

    if (_isSidebar) {
      return Center(
        child: Text(
          PosBranding.fallbackInitial,
          style: TextStyle(
            color: brand.primary,
            fontSize: size * 0.38,
            fontWeight: FontWeight.w800,
          ),
        ),
      );
    }

    final bg = isDark
        ? context.posSurface.elevatedSurface
        : brand.primary.withValues(alpha: 0.1);
    final border = isDark
        ? context.posSurface.border
        : brand.primary.withValues(alpha: 0.28);
    final fg = isDark ? context.posSurface.textPrimary : brand.primary;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      alignment: Alignment.center,
      child: Text(
        PosBranding.fallbackInitial,
        style: TextStyle(
          color: fg,
          fontSize: size * 0.42,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// Contrasting frame so image and fallback logos read on the sidebar rail.
class _LogoFrame extends StatelessWidget {
  const _LogoFrame({
    required this.size,
    required this.variant,
    required this.child,
  });

  final double size;
  final PosBrandLogoVariant variant;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (variant == PosBrandLogoVariant.sidebar) {
      return Container(
        width: size,
        height: size,
        padding: EdgeInsets.all(size * 0.1),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: child,
      );
    }

    if (context.isPosDark) {
      return Container(
        width: size,
        height: size,
        padding: EdgeInsets.all(size * 0.08),
        decoration: BoxDecoration(
          color: context.posSurface.elevatedSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: context.posSurface.border),
        ),
        child: child,
      );
    }

    return SizedBox(width: size, height: size, child: child);
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
        SizedBox(height: 14),
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
