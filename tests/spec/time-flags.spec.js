'use strict';

const Filer = require('../../src');
const util = require('../lib/test-utils.js');
const expect = require('chai').expect;

describe('node times (atime, mtime, ctime) with mount flags', function() {

  const dirname = '/dir';
  const filename = '/dir/file';

  function memoryFS(flags, callback) {
    const name = util.uniqueName();
    return new Filer.FileSystem({
      name: name,
      flags: flags || [],
      provider: new Filer.FileSystem.providers.Memory(name)
    }, callback);
  }

  function createTree(fs, callback) {
    fs.mkdir(dirname, function(error) {
      if(error) throw error;

      fs.open(filename, 'w', function(error, fd) {
        if(error) throw error;

        fs.close(fd, callback);
      });
    });
  }

  function stat(fs, path, callback) {
    fs.stat(path, function(error, stats) {
      if(error) throw error;

      callback(stats);
    });
  }

  /**
   * We test the actual time updates in times.spec.js, whereas these just test
   * the overrides with the mount flags.  The particular fs methods called
   * are unimportant, but are known to affect the particular times being suppressed.
   */

  it('should not update ctime when calling fs.rename() with NOCTIME', function(done) {
    memoryFS(['NOCTIME'], function(error, fs) {
      const newfilename = filename + '1';

      createTree(fs, function() {
        stat(fs, filename, function(stats1) {

          fs.rename(filename, newfilename, function(error) {
            if(error) throw error;

            stat(fs, newfilename, function(stats2) {
              expect(stats2.ctimeMs).to.equal(stats1.ctimeMs);
              expect(stats2.mtimeMs).to.equal(stats1.mtimeMs);
              expect(stats2.atimeMs).to.equal(stats1.atimeMs);
              done();
            });
          });
        });
      });
    });
  });

  it('should not update ctime, mtime, atime when calling fs.truncate() with NOCTIME, NOMTIME', function(done) {
    memoryFS(['NOCTIME', 'NOMTIME'], function(error, fs) {
      createTree(fs, function() {
        stat(fs, filename, function(stats1) {

          fs.truncate(filename, 5, function(error) {
            if(error) throw error;

            stat(fs, filename, function(stats2) {
              expect(stats2.ctimeMs).to.equal(stats1.ctimeMs);
              expect(stats2.mtimeMs).to.equal(stats1.mtimeMs);
              expect(stats2.atimeMs).to.equal(stats1.atimeMs);
              done();
            });
          });
        });
      });
    });
  });

  it('should not update mtime when calling fs.truncate() with NOMTIME', function(done) {
    memoryFS(['NOMTIME'], function(error, fs) {
      createTree(fs, function() {
        stat(fs, filename, function(stats1) {

          fs.truncate(filename, 5, function(error) {
            if(error) throw error;

            stat(fs, filename, function(stats2) {
              expect(stats2.ctimeMs).to.be.at.least(stats1.ctimeMs);
              expect(stats2.mtimeMs).to.equal(stats1.mtimeMs);
              expect(stats2.atimeMs).to.be.at.least(stats1.atimeMs);
              done();
            });
          });
        });
      });
    });
  });
});
