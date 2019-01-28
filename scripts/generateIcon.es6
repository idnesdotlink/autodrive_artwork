import path from 'path'
import {readdirSync, statSync, readFileSync} from 'fs'
import yaml from 'js-yaml'
import {each, map} from 'lodash'
import svg2png from 'svg2png'
import {promisify} from 'bluebird'

const pathRoot = path.resolve('.')
const srcPath = path.join(pathRoot, 'src')
const distPath = path.join(pathRoot, 'dist')

let walkSync = function (dir, filelist) {
  let files = readdirSync(dir);
  filelist = filelist || []; 
  each(
    files,
    function (file) {
      let pathToFile = path.join(dir, file)
      if (statSync(pathToFile).isDirectory()) walkSync(pathToFile, filelist)
      else if (path.extname(file) === '.yml' && file === 'create.yml') {
        let dir = path.dirname(pathToFile).split(path.sep).pop()
        let data = yaml.safeLoad(readFileSync(pathToFile, 'utf8'));
        let { source, name, output } = data
        source = path.join(path.dirname(pathToFile), source)
        let dist = []
        each(output, item => {
          dist.push(path.join(distPath, dir, name, item.directory));
        })
        filelist.push({source, dist})
      }
    }
  );
}

function xt(x) {
  let fl = [];
  walkSync(x, fl)
  return fl;
}

xt(srcPath);