'use strict';

var _ = require('lodash');

module.exports.deleteAtPath = function(structure, fullPath) {
  var traverse = function(path, struct) {
    var match = _.matchesProperty('name', path[0]);
    var item = _.find(struct.children, match);

    if (path.length === 1) {
      _.remove(struct.children, match);
      return item;
    }

    if (!item) return null;

    return traverse(_.tail(path), item);
  };

  if (fullPath.length === 0) return null;
  var split = _.filter(fullPath.split('/'), _.identity);
  if (split.length === 0) return null;
  return traverse(split, structure);
};

module.exports.getAtPath = function(structure, fullPath) {
  var traverse = function(path, struct) {
    if (path.length === 0) return struct;
    if (path[0].length === 0) return traverse(_.tail(path), struct);

    var next = _.find(struct.children, function(child) {
      return child.name === path[0];
    });
    if (!next) return null;

    return traverse(_.tail(path), next);
  };

  return traverse(fullPath.split('/'), structure);
};

// deletes a file with a given storj id, returns true if it existed
module.exports.deleteById = function(storjId, fileSystem) {
  var findAndDelete = function(files) {
    if (!files.children) return false;

    var childCount = files.children.length;
    _.remove(files.children, _.matchesProperty('storjId', storjId));
    if (files.children.length !== childCount) return true;

    var next = _.filter(files.childern, _.matchesProperty('type', 'directory'));
    return _.some(next, findAndDelete);
  };

  return findAndDelete(fileSystem);
};
