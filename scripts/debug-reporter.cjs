class DebugReporter {
  onInit() {
    console.log("[DEBUG] custom reporter loaded ✅");
  }

  onFinished() {
    console.log("[DEBUG] tests finished ✅");
  }
}

module.exports = DebugReporter;
