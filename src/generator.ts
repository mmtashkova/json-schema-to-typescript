import {memoize, omit} from 'lodash'
import {DEFAULT_OPTIONS, Options} from './index'
import {
  AST,
  ASTWithStandaloneName,
  hasComment,
  hasStandaloneName,
  T_ANY,
  TArray,
  TEnum,
  TClass,
  TIntersection,
  TNamedClass,
  TUnion,
  T_UNKNOWN
} from './types/AST'
import {log, toSafeString} from './utils'

class Test {
  public static multiset = new Set()
}

export function generate(ast: AST, options = DEFAULT_OPTIONS): string {
  return (
    [
      /*options.bannerComment,*/
      declareNamedTypes(ast, options, ast.standaloneName!),
      declareNamedClasss(ast, options, ast.standaloneName!),
      declareEnums(ast, options)
    ]
      .filter(Boolean)
      .join('\n') + '\n'
  ) // trailing newline
}

function declareEnums(ast: AST, options: Options, processed = new Set<AST>()): string {
  if (processed.has(ast)) {
    return ''
  }
  if (ast.keyName != undefined && ast.keyName.includes('spec')) {
    ast.keyName = 'spec'
  }
  processed.add(ast)
  let type = ''

  switch (ast.type) {
    case 'ENUM':
      return generateStandaloneEnum(ast, options) + '\n'
    case 'ARRAY':
      return declareEnums(ast.params, options, processed)
    case 'UNION':
    case 'INTERSECTION':
      return ast.params.reduce((prev, ast) => prev + declareEnums(ast, options, processed), '')
    case 'TUPLE':
      type = ast.params.reduce((prev, ast) => prev + declareEnums(ast, options, processed), '')
      if (ast.spreadParam) {
        type += declareEnums(ast.spreadParam, options, processed)
      }
      return type
    case 'CLASS':
      return getSuperTypesAndParams(ast).reduce((prev, ast) => prev + declareEnums(ast, options, processed), '')
    default:
      return ''
  }
}

function declareNamedClasss(ast: AST, options: Options, rootASTName: string, processed = new Set<AST>()): string {
  if (processed.has(ast)) {
    return ''
  }
  if (ast.keyName != undefined && ast.keyName.includes('spec')) {
    ast.keyName = 'spec'
    //console.log(ast.keyName)
  }
  processed.add(ast)
  let type = ''

  switch (ast.type) {
    case 'ARRAY':
      type = declareNamedClasss((ast as TArray).params, options, rootASTName, processed)
      break
    case 'CLASS': {
      type = [
        hasStandaloneName(ast) &&
          (ast.standaloneName === rootASTName || options.declareExternallyReferenced) &&
          generateStandaloneClass(ast, options),
        getSuperTypesAndParams(ast)
          .map(ast => declareNamedClasss(ast, options, rootASTName, processed))
          .filter(Boolean)
          .join('\n')
      ]
        .filter(Boolean)
        .join('\n')
      break
    }
    case 'INTERSECTION':
    case 'TUPLE':
    case 'UNION':
      type = ast.params
        .map(_ => declareNamedClasss(_, options, rootASTName, processed))
        .filter(Boolean)
        .join('\n')
      if (ast.type === 'TUPLE' && ast.spreadParam) {
        type += declareNamedClasss(ast.spreadParam, options, rootASTName, processed)
      }
      break
    default:
      type = ''
  }

  return type
}

function declareNamedTypes(ast: AST, options: Options, rootASTName: string, processed = new Set<AST>()): string {
  if (processed.has(ast)) {
    return ''
  }
  if (ast.keyName != undefined && ast.keyName.includes('spec')) {
    ast.keyName = 'spec'
  }
  processed.add(ast)

  switch (ast.type) {
    case 'ARRAY': {
      return [
        declareNamedTypes(ast.params, options, rootASTName, processed),
        hasStandaloneName(ast) ? generateStandaloneType(ast, options) : ''
      ]
        .filter(Boolean)
        .join('\n')
    }
    case 'ENUM':
      return ''
    case 'CLASS': {
      return getSuperTypesAndParams(ast)
        .map(
          ast =>
            (ast.standaloneName === rootASTName || options.declareExternallyReferenced) &&
            declareNamedTypes(ast, options, rootASTName, processed)
        )
        .filter(Boolean)
        .join('\n')
    }
    case 'INTERSECTION':
    case 'TUPLE':
    case 'UNION':
      return [
        hasStandaloneName(ast) ? generateStandaloneType(ast, options) : undefined,
        ast.params
          .map(ast => declareNamedTypes(ast, options, rootASTName, processed))
          .filter(Boolean)
          .join('\n'),
        'spreadParam' in ast && ast.spreadParam
          ? declareNamedTypes(ast.spreadParam, options, rootASTName, processed)
          : undefined
      ]
        .filter(Boolean)
        .join('\n')
    default: {
      if (hasStandaloneName(ast)) {
        return generateStandaloneType(ast, options)
      }
      return ''
    }
  }
}

function generateTypeUnmemoized(ast: AST, options: Options): string {
  if (ast.keyName != undefined && ast.keyName.includes('spec')) {
    ast.keyName = 'spec'
  }
  const type = generateRawType(ast, options)
  if (options.strictIndexSignatures && ast.keyName === '[k: string]') {
    return `${type}`
  }

  return type
}
export const generateType = memoize(generateTypeUnmemoized)

function generateRawType(ast: AST, options: Options): string {
  log('magenta', 'generator', ast)
  if (hasStandaloneName(ast)) {
    return toSafeString(ast.standaloneName)
  }
  switch (ast.type) {
    case 'ANY':
      return 'any'
    case 'ARRAY':
      return (() => {
        const type = generateType(ast.params, options) != 'undefined;' ? generateType(ast.params, options) : ''
        return type.endsWith('"') ? '(' + type + ')[]' : type + '[]'
      })()
    case 'BOOLEAN':
      return 'boolean'
    case 'CLASS': {
      let st = ast.keyName
      if (ast.keyName != undefined) {
        st = capitalizeFirstLetter(ast.keyName)
      }
      return st + ';'
    }
    case 'INTERSECTION':
      return generateSetOperation(ast, options)
    case 'LITERAL':
      return JSON.stringify(ast.params)
    case 'NUMBER':
      return 'number'
    case 'NULL':
      return 'null'
    case 'OBJECT':
      return 'object'
    case 'REFERENCE':
      return ast.params
    case 'STRING':
      return 'string'
    case 'TUPLE':
      return (() => {
        const minItems = ast.minItems
        const maxItems = ast.maxItems || -1

        let spreadParam = ast.spreadParam
        const astParams = [...ast.params]
        if (minItems > 0 && minItems > astParams.length && ast.spreadParam === undefined) {
          // this is a valid state, and JSONSchema doesn't care about the item type
          if (maxItems < 0) {
            // no max items and no spread param, so just spread any
            spreadParam = options.unknownAny ? T_UNKNOWN : T_ANY
          }
        }
        if (maxItems > astParams.length && ast.spreadParam === undefined) {
          // this is a valid state, and JSONSchema doesn't care about the item type
          // fill the tuple with any elements
          for (let i = astParams.length; i < maxItems; i += 1) {
            astParams.push(options.unknownAny ? T_UNKNOWN : T_ANY)
          }
        }

        function addSpreadParam(params: string[]): string[] {
          if (spreadParam) {
            const spread = '...(' + generateType(spreadParam, options) + ')[]'
            params.push(spread)
          }
          return params
        }

        function paramsToString(params: string[]): string {
          return '[' + params.join(', ') + ']'
        }

        const paramsList = astParams.map(param => generateType(param, options))

        if (paramsList.length > minItems) {
          /*
        if there are more items than the min, we return a union of tuples instead of
        using the optional element operator. This is done because it is more typesafe.

        // optional element operator
        type A = [string, string?, string?]
        const a: A = ['a', undefined, 'c'] // no error

        // union of tuples
        type B = [string] | [string, string] | [string, string, string]
        const b: B = ['a', undefined, 'c'] // TS error
        */

          const cumulativeParamsList: string[] = paramsList.slice(0, minItems)
          const typesToUnion: string[] = []

          if (cumulativeParamsList.length > 0) {
            // actually has minItems, so add the initial state
            typesToUnion.push(paramsToString(cumulativeParamsList))
          } else {
            // no minItems means it's acceptable to have an empty tuple type
            typesToUnion.push(paramsToString([]))
          }

          for (let i = minItems; i < paramsList.length; i += 1) {
            cumulativeParamsList.push(paramsList[i])

            if (i === paramsList.length - 1) {
              // only the last item in the union should have the spread parameter
              addSpreadParam(cumulativeParamsList)
            }

            typesToUnion.push(paramsToString(cumulativeParamsList))
          }

          return typesToUnion.join('|')
        }

        // no max items so only need to return one type
        return paramsToString(addSpreadParam(paramsList))
      })()
    case 'UNION':
      return generateSetOperation(ast, options)
    case 'UNKNOWN':
      return 'unknown'
    case 'CUSTOM_TYPE':
      return ast.params
  }
}
function capitalizeFirstLetter(str: any) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
/*function fromCamelCase(value: any) {
  const spaced = value.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}*/

/**
 * Generate a Union or Intersection
 */
function generateSetOperation(ast: TIntersection | TUnion, options: Options): string {
  const members = (ast as TUnion).params.map(_ => generateType(_, options))
  const separator = ast.type === 'UNION' ? '|' : '&'
  return members.length === 1 ? members[0] : '(' + members.join(' ' + separator + ' ') + ')'
}

function generateClass(ast: TClass, options: Options): string {
  if (ast.keyName != undefined) {
    options.bannerBehavior = ''
  }
  if (Test.multiset.has(ast.standaloneName)) {
    return ''
  } else {
    Test.multiset.add(ast.standaloneName)
  }
  if (ast.keyName != undefined && ast.keyName.includes('spec')) {
    ast.keyName = 'spec'
  }
  return (
    `{` +
    '\n' +
    ast.params
      .filter(_ => !_.isPatternProperty && !_.isUnreachableDefinition)
      .map(
        ({isRequired, ast}) =>
          [isRequired, ast.keyName, ast, generateType(ast, options)] as [boolean, string, AST, string]
      )
      .map(
        ([isRequired, keyName, ast, type]) =>
          (hasComment(ast) && !ast.standaloneName ? generateComment(ast.comment) + '\n' : '') +
          escapeKeyName(keyName) +
          (isRequired ? '' : '?') +
          ': ' +
          (hasStandaloneName(ast) ? toSafeString(type) : type)
      )
      .join('\n') +
    '\n' +
    options.bannerBehavior +
    '\n' +
    '}' +
    '\n'
  )
}

function generateComment(comment: string): string {
  return ['/**', ...comment.split('\n').map(_ => ' * ' + _), ' */'].join('\n')
}

function generateStandaloneEnum(ast: TEnum, options: Options): string {
  return (
    (hasComment(ast) ? generateComment(ast.comment) + '\n' : '') +
    'export ' +
    (options.enableConstEnums ? 'const ' : '') +
    `enum ${toSafeString(ast.standaloneName)} {` +
    '\n' +
    ast.params.map(({ast, keyName}) => keyName + ' = ' + generateType(ast, options)).join(',\n') +
    '\n' +
    '}'
  )
}

function generateStandaloneClass(ast: TNamedClass, options: Options): string {
  const test = generateClass(ast, options)
  if (ast.keyName != undefined) {
    options.bannerComment = ''
  }
  if (test == '') {
    return ''
  }
  return (
    options.bannerComment +
    '\n' +
    `export class ${toSafeString(ast.standaloneName)} ` +
    (ast.superTypes.length > 0
      ? `extends ${ast.superTypes.map(superType => toSafeString(superType.standaloneName)).join(', ')} `
      : '') +
    test
  )
}

function generateStandaloneType(ast: ASTWithStandaloneName, options: Options): string {
  return (
    (hasComment(ast) ? generateComment(ast.comment) + '\n' : '') +
    `export type ${toSafeString(ast.standaloneName)} = ${generateType(
      omit<AST>(ast, 'standaloneName') as AST /* TODO */,
      options
    )}`
  )
}

function escapeKeyName(keyName: string): string {
  if (keyName.length && /[A-Za-z_$]/.test(keyName.charAt(0)) && /^[\w$]+$/.test(keyName)) {
    return keyName
  }
  if (keyName === '[k: string]') {
    return keyName
  }
  return JSON.stringify(keyName)
}

function getSuperTypesAndParams(ast: TClass): AST[] {
  return ast.params.map(param => param.ast).concat(ast.superTypes)
}
