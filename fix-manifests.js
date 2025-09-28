const fs = require("fs");
const path = require("path");

function removePackageAttr(dir) {
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      removePackageAttr(filePath);
    } else if (file === "AndroidManifest.xml") {
      let content = fs.readFileSync(filePath, "utf8");
      if (content.includes("package=")) {
        const fixed = content.replace(/<manifest([^>]+)package="[^"]+"/, "<manifest$1");
        if (fixed !== content) {
          fs.writeFileSync(filePath, fixed, "utf8");
          console.log("✔ Fixed:", filePath);
        }
      }
    }
  });
}

// Run inside node_modules
removePackageAttr(path.join(__dirname, "node_modules"));
