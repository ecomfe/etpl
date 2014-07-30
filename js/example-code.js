var EXAMPLE_CODE = {
    'target': {
        tpl: [
            '<!-- target: myTpl -->',
            '<!-- import: header -->',
            '<div class="main">Hello ${name}!</div>',
            '<!-- import: footer -->',
            '<!-- /target -->',
            '',
            '<!-- target: header -->',
            '<header>Header Content</header>',
            '<!-- /target -->',
            '',
            '<!-- target: footer -->',
            '<footer>Footer Content</footer>',
            '<!-- /target -->'
        ].join('\n')
    },

    'notarget': {
        tpl: [
            '<header>Header Content</header>',
            '<div class="main">Hello ${name}!</div>',
            '<footer>Footer Content</footer>'
        ].join('\n')
    },

    'auto-close': {
        tpl: [
            '<!-- target: myTpl -->',
            '<!-- import: header -->',
            '<div class="main">Hello ${name}!</div>',
            '<!-- import: footer -->',
            '',
            '<!-- target: header -->',
            '<header>Header Content</header>',
            '',
            '<!-- target: footer -->',
            '<footer>Footer Content</footer>'
        ].join('\n')
    },

    'html-style': {
        tpl: [
            '<!-- if: ${name} != null -->',
            '    Hello ${name}!',
            '<!-- else -->',
            '    noname!',
            '<!-- /if -->'
        ].join('\n')
    },

    'import': {
        tpl: [
            '<!-- target: myTpl -->',
            '<!-- import: header -->',
            '<div class="main">Hello ${name}!</div>',
            '',
            '<!-- target: header -->',
            '<header>Header Content</header>'
        ].join('\n')
    },

    'master': {
        tpl: [
            '<!-- target: myTpl(master = page) -->',
            '<!-- block: content -->',
            '    Hello ${name}!',
            '<!-- /block -->',
            '',
            '<!-- target: page -->',
            '<header><!-- block: header -->Header Content<!-- /block --></header>',
            '<div class="main"><!-- block: content --><!-- /block --></div>'
        ].join('\n')
    },

    'import-block': {
        tpl: [
            '<!-- target: myTpl -->',
            '<!-- import: header -->',
            '<!-- import: main -->',
            '    <!-- block: main -->',
            '        <!-- import: list -->',
            '            <!-- block: list -->biz list<!-- /block -->',
            '        <!-- /import -->',
            '        <!-- import: pager -->',
            '            <!-- block: pager -->biz pager<!-- /block -->',
            '        <!-- /import -->',
            '    <!-- /block -->',
            '<!-- /import -->',
            '',
            '<!-- target: header -->',
            '<header><!-- block: header -->default header<!-- /block --></header>',
            '',
            '<!-- target: main -->',
            '<div>',
            '    <!-- block: main -->default main<!-- /block -->',
            '</div>',
            '',
            '<!-- target: list -->',
            '<div class="list">',
            '    <!-- block: list -->default list<!-- /block -->',
            '</div>',
            '',
            '<!-- target: pager -->',
            '<div class="pager">',
            '    <!-- block: pager -->default pager<!-- /block -->',
            '</div>'
        ].join('\n')
    },

    'use': {
        tpl: [
            '<ul>',
            '<!-- for: ${persons} as ${p} -->',
            '    <!-- use: item(main=${p.name}, sub=${p.email}) -->',
            '<!-- /for -->',
            '</ul>',
            '',
            '<!-- target: item --><li>${main}[${sub}]</li>'
        ].join('\n'),
        data: [
            '{',
            '    persons: [',
            '        {',
            '            name:"erik", ',
            '            email:"errorrik@gmail.com"',
            '        },',
            '        {',
            '            name:"otakustay",',
            '            email:"otakustay@gmail.com"',
            '        }',
            '    ]',
            '}'
        ].join('\n')
    },

    'for': {
        tpl: [
            '<ul>',
            '<!-- for: ${persons} as ${person} -->',
            '    <li>${person.name}[${person.email}]</li>',
            '<!-- /for -->',
            '</ul>'
        ].join('\n'),
        data: [
            '{',
            '    persons: [',
            '        {',
            '            name:"erik", ',
            '            email:"errorrik@gmail.com"',
            '        },',
            '        {',
            '            name:"otakustay",',
            '            email:"otakustay@gmail.com"',
            '        }',
            '    ]',
            '}'
        ].join( '\n' )
    },


    'filter': {
        tpl: [
            'Hello ${htmlContent}!',
            'Hello ${htmlContent | raw}!',
            'Search <a href="http://www.baidu.com/s?wd=${urlContent | url}">${urlContent}</a>!',
            'Search <a href="http://www.baidu.com/s?wd=${urlContent | slice(0, 2) | url}">${urlContent | slice(0, 2)}</a>!'
        ].join('\n'),
        data: [
            '{ ',
            '    htmlContent: "<b>ETPL</b>",',
            '    urlContent: "模板引擎"',
            '}'
        ].join('\n')
    },

    'custom': {
        tpl: [
            '<% target myTpl %>',
            '<% import header %>',
            '<div class="main">Hello {{name}}!</div>',
            '<% import footer %>',
            '',
            '<% target header %>',
            '<header>Header Content</header>',
            '',
            '<% target footer %>',
            '<footer>Footer Content</footer>'
        ].join('\n'),
        options: {
            commandSyntax: '^\\s*(\\\/)?([a-z]+)\\s?([\\s\\S]*)$',
            commandOpen: '<%',
            commandClose: '%>',
            variableOpen: '{{',
            variableClose: '}}',
            defaultFilter: 'html'
        }
    },

    'var': {
        tpl: [
            '<!-- var: name = "errorrik" -->',
            'Hello ${name}!'
        ].join('\n')
    },

    'data-getter': {
        tpl: [
            'Hello ${ETPL}!'
        ].join('\n'),

        data: [
            '{',
            '    get: function (name) {',
            '        return name + " :D";',
            '    }',
            '}'
        ].join('\n')
    },

    'filter-block': {
        tpl: [
            '<!-- filter: markdown -->',
            '## ETpl Contributors',
            '',
            '- errorrik',
            '- otakustay',
            '- firede',
            '',
            '<!-- /filter -->'
        ].join('\n')
    }
};

var EXAMPLE_CODE_NAV = [
    { title: 'HTML风格', example: 'html-style' },
    { title: '片段划分', example: 'target' },
    { title: '无片段划分', example: 'notarget' },
    { title: '自闭合', example: 'auto-close' },
    { title: '直接引用', example: 'import' },
    { title: '模版继承(母版)', example: 'master' },
    { title: '引用代入', example: 'import-block' },
    { title: '动态调用', example: 'use' },
    { title: '循环', example: 'for' },
    { title: '过滤器', example: 'filter' },
    { title: '语法风格定制', example: 'custom' },
    { title: '数据声明', example: 'var' },
    { title: 'Data Getter', example: 'data-getter' },
    { title: '内容块过滤', example: 'filter-block' }
];

var EXAMPLE_DEFAULT_DATA = [
    '{',
    '    name: "ETpl"',
    '}'
].join('\n');

var EXAMPLE_DEFAULT_OPTIONS = {
    commandSyntax: '^\\s*(\\\/)?([a-z]+)\\s*(?::([\\s\\S]*))?$',
    commandOpen: '<!--',
    commandClose: '-->',
    variableOpen: '${',
    variableClose: '}',
    defaultFilter: 'html'
};



