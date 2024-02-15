/**
 * Configuration for Accessibility Checker
 * @link https://www.npmjs.com/package/accessibility-checker
 */

export default {
    ruleArchive: "latest",
    policies: [
        'WCAG_2_1'
    ],
    failLevels: [
        'violation', 
        'potentialviolation'
    ],
    reportLevels: [
        'violation', 
        'potentialviolation',
        'recommendation',
        'potentialrecommendation',
        'manual',
        'pass'
    ],
    outputFolder: "a11y",
    outputFormat: [
        'html'
    ],
    outputFilenameTimestamp: false
}