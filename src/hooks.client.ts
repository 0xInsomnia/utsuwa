import { getLocale, overwriteGetLocale } from '$lib/paraglide/runtime';
import { isAppPage } from '$lib/i18n/app-locale';
import { currentAppLocale } from '$lib/i18n/language';
import { isDesktopBuild } from '$lib/services/platform/platform';

// App pages take their language from Settings > Display or the device
// (see app-locale.ts). Everything else keeps Paraglide's URL strategy. The app
// side never reaches Paraglide's URL handling, which throws on the opaque
// tauri:// origin of the desktop build.
const appLocale = currentAppLocale();
const marketingLocale = getLocale;
const onAppPage = () => isDesktopBuild() || isAppPage(location.pathname, location.hostname);

overwriteGetLocale(() => (onAppPage() ? appLocale : marketingLocale()));

if (onAppPage()) document.documentElement.lang = appLocale;
