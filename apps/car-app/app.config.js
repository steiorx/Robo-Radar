const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.steiorx.carapp.dev';
  }

  if (IS_PREVIEW) {
    return 'com.steiorx.carapp.preview';
  }

  return 'com.steiorx.carapp';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Car Controller (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Car Controller (Preview)';
  }

  return 'Car Controller';
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
