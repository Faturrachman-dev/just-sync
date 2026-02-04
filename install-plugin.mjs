import fs from 'fs';
import path from 'path';

// Configuration
const SOURCE_DIR = './dist';
// Default to the path used in recent commands, but allow override via env var
const TARGET_DIR = process.env.OBSIDIAN_PLUGIN_DIR || "E:\\FATUR\\master\\.obsidian\\plugins\\just-sync";

if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Error: Source directory ${SOURCE_DIR} does not exist. Run 'npm run build' first.`);
    process.exit(1);
}

if (!fs.existsSync(TARGET_DIR)) {
    console.log(`Creating target directory: ${TARGET_DIR}`);
    try {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    } catch (err) {
        console.error(`Error creating directory: ${err.message}`);
        process.exit(1);
    }
}

console.log(`Deploying plugin from ${SOURCE_DIR} to ${TARGET_DIR}...`);

try {
    const files = fs.readdirSync(SOURCE_DIR);
    let copiedCount = 0;

    for (const file of files) {
        const srcPath = path.join(SOURCE_DIR, file);
        const destPath = path.join(TARGET_DIR, file);
        
        // Only copy files, skip directories if any (dist shouldn't have nested dirs usually)
        if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  -> Copied ${file}`);
            copiedCount++;
        }
    }
    console.log(`Successfully deployed ${copiedCount} files.`);
} catch (err) {
    console.error(`Deployment failed: ${err.message}`);
    process.exit(1);
}
