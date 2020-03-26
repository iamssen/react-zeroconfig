module.exports = (computedPackageJson, rootPackageJson) => {
  const rootDependencies = { ...rootPackageJson.devDependencies, ...rootPackageJson.dependencies };
  const customDependencies = [
    // style loaders
    'less',
    'less-loader',
    'node-sass',
    'sass-loader',
    // eslint-config-react-app
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'babel-eslint',
    'eslint',
    'eslint-plugin-flowtype',
    'eslint-plugin-import',
    'eslint-plugin-jsx-a11y',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
  ].reduce((deps, name) => {
    deps[name] = rootDependencies[name];
    return deps;
  }, {});

  return {
    keywords: ['zeroconfig', 'react', 'typescript', 'webpack', 'build', '0cjs'],
    bin: {
      'zeroconfig-webapp-scripts': './bin/zeroconfig-webapp-scripts',
      'zeroconfig-package-scripts': './bin/zeroconfig-package-scripts',
      'zeroconfig-desktopapp-scripts': './bin/zeroconfig-desktopapp-scripts',
      'zeroconfig-extension-scripts': './bin/zeroconfig-extension-scripts',
    },
    ...computedPackageJson,
    dependencies: { ...customDependencies, ...computedPackageJson.dependencies },
  };
};
