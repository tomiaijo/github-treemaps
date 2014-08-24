var fileEndingToLanguage =
{
    'ai': 'Adobe Illustrator Artwork',
    'applescript': 'AppleScript',
    'adb': 'Ada',
    'ads': 'Ada',
    'asm': 'Assembly',
    'c': 'C',
    'c++': 'C++',
    'cbl': 'Cobol',
    'cc': 'C++',
    'ceylon': 'Ceylon',
    'clj': 'Clojure',
    'coffee': 'CoffeeScript',
    'cpp': 'C++',
    'cs': 'C#',
    'csv': 'Comma Separated Value',
    'css': 'CSS',
    'cxx': 'C++',
    'd': 'd',
    'dat': 'DATA file',
    'dart': 'Dart',
    'dockerfile': 'DockerFile',
    'eot': 'Embedded OpenType',
    'erl': 'Erlang',
    'ext': 'xtend',
    'f': 'Fortran',
    'fish': 'Friendly Interactive Shell',
    'f90': 'Fortran',
    'f95': 'Fortran',
    'for': 'Fortran',
    'fs': 'F#',
    'fsi': 'F#',
    'fsx': 'F#',
    'gif': 'GIF',
    'gitignore': 'gitignore',
    'go': 'Go',
    'groovy': 'Groovy',
    'gsh': 'Groovy',
    'gvy': 'Groovy',
    'gy': 'Groovy',
    'h': 'C',
    'h++': 'C++',
    'hh': 'C++',
    'hpp': 'C++',
    'hrl': 'Erlang',
    'hs': 'Haskell',
    'ht': 'Kotlin',
    'html': 'HTML',
    'hx': 'Haxe',
    'hxml': 'Haxe',
    'hxx': 'C++',
    'java': 'Java',
    'jl': 'Julia',
    'jpg': 'JPEG',
    'jpeg': 'JPEG',
    'js': 'JavaScript',
    'json': 'JSON',
    'less': 'Leaner CSS',
    'lhs': 'Haskell',
    'lisp': 'Common Lisp',
    'lua': 'Lua',
    'm': 'MATLAB',
    'map': 'Source Map',
    'makefile': 'MakeFile',
    'markdown': 'Markdown',
    'md': 'Markdown',
    'ml': 'OCaml',
    'mli': 'OCaml',
    'mm': 'Objective-C',
    'otf': 'OpenType',
    'p': 'Prolog',
    'pas': 'Pascal',
    'php': 'PHP',
    'php3': 'PHP',
    'php4': 'PHP',
    'php5': 'PHP',
    'phps': 'PHP',
    'phtml': 'PHP',
    'pl': 'Perl',
    'png': "PNG",
    'pp': 'Pascal',
    'pdf': "Portable Document Format",
    'pro': 'Prolog',
    'ps1': 'Powershell',
    'psd': 'Photoshop Document',
    'py': 'Python',
    'r': 'R',
    'rb': 'Ruby',
    'rkt': 'Racket',
    'rktd': 'Racket',
    'rktl': 'Racket',
    'rs': 'Rust',
    'sas': 'SAS',
    'scala': 'Scala',
    'scm': 'Scheme',
    'scpt:': 'AppleScript',
    'scss': 'Syntactically Awesome Style Sheets',
    'sh': 'Bourne shell',
    'sql': 'SQL',
    'ss': 'Scheme',
    'st': 'Smalltalk',
    'svg': 'Scalable Vector Graphics',
    'swift': 'Swift',
    'tar': 'Tar Archive',
    'tcl': 'Tcl',
    'tex': 'TeX',
    'tiff': 'Tagged Image File Format',
    'ts': 'TypeScript',
    'ttf': 'TrueType',
    'txt': "Text File",
    'v': 'Verilog',
    'vala': 'Vala',
    'vapi': 'Vala',
    'vb': 'Visual Basic',
    'vhdl': 'VHDL',
    'woff': 'Web Open Font Format',
    'xml': 'XML',
    'xq': 'XQuery',
    'xquery': 'XQuery',
    'xqy': 'XQuery',
    'xslt': 'XSLT',
    'yml': 'YAML',
    'yaml': 'YAML',
    'zip': 'ZIP Archive'
};

function getProgrammingLanguage(filename) {
    var fileExtension = filename.split('.').pop().toLowerCase();
    if (fileExtension in fileEndingToLanguage) {
        return fileEndingToLanguage[fileExtension];
    }

    return 'Unknown';
}