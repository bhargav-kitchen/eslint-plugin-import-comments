
'use strict';

var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var utils = require('../utils/');

module.exports = {
  create: function(context) {
    return {
      ImportDeclaration(node) {
        if (_.isEmpty(context.options)) return;

        var currentNode = node;
        var isFirstImportNode = utils.isFirstImportNode(node, context);

        if (isFirstImportNode) {
          var sourceCode = context.getSourceCode();
          var nextImportNodes = utils.getNextImportNodes(node, context);

          var allImportNodes = [node].concat(nextImportNodes);
          var allCommentNodes = sourceCode.getAllComments();
          var importCommentNodes = _.filter(allCommentNodes, function (comment) {
            return (
              comment.end < _.last(allImportNodes).start
            );
          });
          var commentRules = context.options;

          allImportNodes.forEach(function(importNode) {
            var associatedComment = _.findLast(importCommentNodes, function(comment) {
              return comment.end < importNode.start;
            });

            var moduleMeta = utils.getModuleMeta(importNode, context, commentRules);
            var commentRule = _.find(commentRules, { moduleType: moduleMeta.moduleType });

            if (commentRule) {
              if (_.get(associatedComment, 'value') !== commentRule.comment) {
                context.report({
                  node: importNode,
                  message: (
                    'module import: no associated "\\\\' + commentRule.comment + '" comment'
                  )
                });
              }
            }
          });

          // var currentRuleIndex = -1;
          // importCommentNodes.forEach(function(commentNode) {
          //   var commentRule = _.find(commentRules, { comment: commentNode.value });

          //   if (commentRule) {
          //     var nextImportNode = utils.getNextImportNode(commentNode, context);
          //     var moduleType = utils.getModuleMeta(nextImportNode, context, commentRules).moduleType;
          //     var moduleCommentRuleIndex = _.findIndex(commentRules, { moduleType });

          //     console.log('moduleCommentRuleIndex', moduleCommentRuleIndex);
          //     if (moduleCommentRuleIndex === -1) return;

          //     if (currentRuleIndex === -1) {
          //       currentRuleIndex = moduleCommentRuleIndex;
          //     }

          //     if (moduleCommentRuleIndex > currentRuleIndex) {
          //       console.log('after');
          //       context.report({
          //         node: nextImportNode,
          //         message: 'module needs to come after "' + commentRules[currentRuleIndex].moduleType + '" modules'
          //       });
          //     } else if (moduleCommentRuleIndex < currentRuleIndex) {
          //       console.log('before');
          //       context.report({
          //         node: nextImportNode,
          //         message: 'module needs to come before "' + commentRules[currentRuleIndex].moduleType + '" modules'
          //       });
          //     } else {
          //       console.log('increment');
          //       currentRuleIndex++;
          //     }
          //   }
          // });
        }
      }
    }
  }
};