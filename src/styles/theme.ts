/**
 * Theme and CSS Generation Utilities
 */

/**
 * Generate CSS custom properties from theme configuration
 */
export function generateThemeCSS(config: any): string {
	const colors = config.styling.colors;
	const effects = config.styling.effects;
	
	return `
		:root {
			/* Colors */
			--color-primary: ${colors.primary};
			--color-primary-hover: ${colors.primaryHover};
			--color-primary-light: ${colors.primaryLight};
			--color-primary-bg: ${colors.primaryBg};
			--color-accent: ${colors.accent};
			--color-accent-hover: ${colors.accentHover};
			--color-accent-light: ${colors.accentLight};
			--color-accent-dark: ${colors.accentDark};
			--color-success: ${colors.success};
			--color-success-hover: ${colors.successHover};
			--color-error: ${colors.error};
			--color-error-bg: ${colors.errorBg};
			--color-warning: ${colors.warning};
			--color-warning-bg: ${colors.warningBg};
			--color-text: ${colors.text};
			--color-text-light: ${colors.textLight};
			--color-text-inverse: ${colors.textInverse};
			--color-background: ${colors.background};
			--color-background-secondary: ${colors.backgroundSecondary};
			--color-background-dark: ${colors.backgroundDark};
			--color-surface: ${colors.surface};
			--color-surface-teal: ${colors.surfaceTeal};
			--color-surface-gold: ${colors.surfaceGold};
			--color-border: ${colors.border};
			--color-border-teal: ${colors.borderTeal};
			--color-border-gold: ${colors.borderGold};
			
			/* Gradients */
			--gradient-primary: ${colors.gradientPrimary};
			--gradient-accent: ${colors.gradientAccent};
			--gradient-dark: ${colors.gradientDark};
			--gradient-teal-gold: ${colors.gradientTealGold};
			
			/* Shadows */
			--shadow-teal: ${colors.shadowTeal};
			--shadow-gold: ${colors.shadowGold};
			--shadow-dark: ${colors.shadowDark};
			
			/* Effects */
			--border-radius: ${effects.borderRadius};
			--border-radius-large: ${effects.borderRadiusLarge};
			--border-radius-small: ${effects.borderRadiusSmall};
			--box-shadow: ${effects.boxShadow};
			--box-shadow-large: ${effects.boxShadowLarge};
			--transition: ${effects.transition};
			
			/* Fonts */
			--font-primary: ${config.styling.fonts.primary};
		}
	`.trim();
}