/**
 * Configuration for Accessibility Checker
 * @link https://www.npmjs.com/package/accessibility-checker
 */

let levels = [
    'violation', 
    'potentialviolation',
    'recommendation',
    'potentialrecommendation',
    'manual',
    'pass'
];
let reportLevels = levels;
let failLevels = levels;

// process args
process.argv.forEach((arg) => {
    // remove any report levels
    if( arg.includes('--no-report-levels-') ){  
      let r = arg.replace('--no-report-levels-', '')
      delete reportLevels[reportLevels.indexOf(r)]
    }
    // remove any fails levels
    if( arg.includes('--no-fail-levels-') ){  
      let f = arg.replace('--no-fail-levels-', '')
      delete failLevels[failLevels.indexOf(f)]
    }
  })

export default {
    ruleArchive: "latest",
    policies: [
        'WCAG_2_1'
    ],
    failLevels: failLevels.filter(e=>e),
    reportLevels: reportLevels.filter(e=>e),
    outputFilename: 'a11y',
    outputFolder: "public",
    outputFormat: [
        'html'
    ],
    outputFilenameTimestamp: false
}