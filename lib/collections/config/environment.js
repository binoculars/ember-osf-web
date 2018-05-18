/* eslint-env node */

module.exports = function(environment) {
    const ENV = {
        environment,
        hostAppName: 'collections',
        modulePrefix: 'collections',
        whiteListedProviders: ['osf'],
    };

    return ENV;
};
