const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.steiorx.radarapp.dev';
  }

  if (IS_PREVIEW) {
    return 'com.steiorx.radarapp.preview';
  }

  return 'com.steiorx.radarapp';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Radar (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Radar (Preview)';
  }

  return 'Radar';
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier()
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});
