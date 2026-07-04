module.exports = {
  default: {
    requireModule: [],
    require: ['features/step_definitions/**/*.js'],
    format: [
      'progress-bar',
      'json:reports/bdd/cucumber-report.json'
    ],
    publishQuiet: true
  }
};
