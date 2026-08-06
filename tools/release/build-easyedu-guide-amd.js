/* eslint-env node */

const fs = require('fs');
const path = require('path');

const terserPackageRoot = process.argv[2];
if (!terserPackageRoot) {
    throw new Error('Pass the absolute directory containing the Moodle toolchain terser package.');
}

const pluginRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(pluginRoot, 'amd', 'src', 'easyedu_guide.js');
const buildPath = path.join(pluginRoot, 'amd', 'build', 'easyedu_guide.min.js');
const mapPath = `${buildPath}.map`;
const moduleName = 'local_groupimport/easyedu_guide';
const terser = require(path.join(path.resolve(terserPackageRoot), 'terser'));

const source = fs.readFileSync(sourcePath, 'utf8');
const wrapper = 'define([], function()';
if (!source.includes(wrapper)) {
    throw new Error('The EasyStud direct AMD wrapper was not found.');
}
if (!source.includes('destroy: destroy') || !source.includes('init: init')) {
    throw new Error('The EasyStud guide wrapper must expose destroy and init before building.');
}

const namedSource = source.replace(
    wrapper,
    `define("${moduleName}", [], function()`
);

terser.minify(
    {'../src/easyedu_guide.js': namedSource},
    {
        compress: true,
        mangle: false,
        sourceMap: {
            filename: path.basename(buildPath),
            url: path.basename(mapPath)
        }
    }
).then(result => {
    if (!result.code || !result.map) {
        throw new Error('Terser did not produce the expected AMD build and source map.');
    }
    if (!result.code.includes(`define("${moduleName}"`)) {
        throw new Error('The generated AMD artifact lost the EasyStud module namespace.');
    }

    fs.writeFileSync(buildPath, `${result.code}\n`, 'utf8');
    fs.writeFileSync(mapPath, `${result.map}\n`, 'utf8');
    process.stdout.write('EasyStud guide AMD build completed.\n');
}).catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
});
