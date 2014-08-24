var githubTreemapsApp = angular.module('githubTreemaps', ['ui.router', 'ui.bootstrap', 'ncy-angular-breadcrumb']);

githubTreemapsApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
        .when('/repository/:id/', '/repository/:id')
        .when('/repository/:id/commit/:commit/', '/repository/:id/commit/:commit')
        .when('/repository/:id/:committer/', '/repository/:id/:committer')
        .when('/repository/tree/', '/repository/tree')
        .otherwise("/");
    $stateProvider
        .state('home', {
            url: "/",
            templateUrl: "main.html",
            controller: "MainCtrl",
            data: {
                summands: [],
                groupings: [],
                groupToStateMapping: {},
                title: "Main",
                ncyBreadcrumbLabel: "Home"
            }
        })
        .state('about', {
            url: "/about",
            templateUrl: "about.html",
            data: {
                summands: [],
                groupings: [],
                groupToStateMapping: {},
                title: "About",
                ncyBreadcrumbLabel: "About",
                ncyBreadcrumbParent: 'home'
            }
        })
        .state('repository', {
            url: '/repository/{id:[0-9]+}',
            template: '<div class="repository" ui-view></div>',
            resolve:{
                repositoryId: ['$stateParams', function($stateParams){
                    return $stateParams.id;
                }],
                repositoryInfo: function($stateParams, $http){
                    return $http.get('http://github-treemap-api.elasticbeanstalk.com/repository/' + $stateParams.id)
                                .then(function(response) { return response.data; });
                }
            },
            data: {
                groupings: ["Commits", "Tree", "Programming Languages"],
                groupToStateMapping:
                {
                    "Commits":  "repository.commits",
                    "Tree":     "repository.tree",
                    "Programming Languages": "repository.languages"
                },
                defaultGrouping: "Commits",
                ncyBreadcrumbParent: 'home',
                ncyBreadcrumbLabel: "{{name}}"
            },
            controller: function($scope, repositoryInfo){
                $scope.name = repositoryInfo.name;
                $scope.description = repositoryInfo.description;
                $scope.version = repositoryInfo.version;
            }
        })
        .state('repository.tree', {
            url: "/tree",
            template: "<div class='chart'></div>",
            controller: "RepositoryTreeCtrl",
            data: {
                summands: ["Size", "Files"],
                defaultGrouping: "Tree",
                tooltipId: "#tooltip-tree",
                renderTooltip: function(d, root, currentNode) {
                    function ancestor(d) {
                        var prev = d;
                        while (prev.parent && prev.parent != currentNode && prev.parent.parent) {
                            prev = prev.parent;
                        }

                        return prev;
                    }

                    d3.select("#tooltip-tree #tree-name")
                        .text(ancestor(d)['id'].substr(1));
                    d3.select("#tooltip-tree #tree-size")
                        .text(Humanize.fileSize(ancestor(d)['size']));
                },
                title: "Repository Tree",
                ncyBreadcrumbLabel: 'Tree'
            }
        })
        .state('repository.tree.zoom', {
            url: "{path:.*}"
        })
        .state('repository.commits', {
            url: "/commits",
            template: "<div class='chart'></div>",
            controller: "RepositoryCtrl",
            data: {
                summands: ["Lines", "Commits", "Additions", "Deletions"],
                tooltipId: "#tooltip-committer",
                renderTooltip: function (d, root) {
                    d3.select("#tooltip-committer #committer-committer")
                        .text(d.parent['name'].split(" <")[0]);
                    var commitPercentage = 100 * (d.parent.children.length / root['total_commit_count']);
                    d3.select("#tooltip-committer #committer-commits")
                        .text(d.parent.children.length + " (" + commitPercentage.toFixed(2) + "%)");
                    d3.select("#tooltip-committer #committer-totalLines")
                        .text(d.parent['total_lines']);
                    d3.select("#tooltip-committer #committer-totalAdditions")
                        .text(d.parent['total_additions']);
                    d3.select("#tooltip-committer #committer-totalDeletions")
                        .text(d.parent['total_deletions']);
                },
                title: "Repository Commits",
                ncyBreadcrumbLabel: 'Commits'
            }
        })
        .state('repository.commits.committer', {
            url: "/{committer:[0-9]+}",
            data: {
                tooltipId: "#tooltip-commit",
                renderTooltip: function (d, root) {
                    d3.select("#tooltip-commit #commit-hash")
                        .text(d['id'].substr(0, 16));
                    d3.select("#tooltip-commit #commit-lines")
                        .text(d['lines']);
                    d3.select("#tooltip-commit #commit-additions")
                        .text(d['additions']);
                    d3.select("#tooltip-commit #commit-deletions")
                        .text(d['deletions']);
                    d3.select("#tooltip-commit #commit-time")
                        .text(moment(new Date(d['time']*1000)).fromNow());

                },
                ncyBreadcrumbSkip: true
            }

        })
        .state('repository.not-indexed-error', {
            url: "/index",
            templateUrl: "notindexed.html",
            controller: "RepositoryNotIndexedCtrl",
            data: {
                summands: [],
                groupings: []
            },
            title: "Repository Not Indexed",
            ncyBreadcrumbSkip: true
        })
        .state('repository.commit', {
            url: "/commit/{commit:[0-9a-zA-Z]+}",
            template: "<div class='chart'></div>",
            controller: "CommitCtrl",
            data: {
                summands: ["Lines", "Additions", "Deletions"],
                tooltipId: "#tooltip-commit-file",
                renderTooltip: function(d, root) {
                    d3.select("#tooltip-commit-file #commit-file-name")
                        .text(d['name']);
                    d3.select("#tooltip-commit-file #commit-file-lines")
                        .text(d['lines']);
                    d3.select("#tooltip-commit-file #commit-file-additions")
                        .text(d['additions']);
                    d3.select("#tooltip-commit-file #commit-file-deletions")
                        .text(d['deletions']);
                },
                title: "Repository Commit",
                ncyBreadcrumbLabel: '{{commitId.substr(0, 16)}}'
            }
        })
        .state('repository.languages', {
            url: "/languages",
            template: "<div class='chart'></div>",
            controller: "LanguageCtrl",
            data: {
                summands: ["Size", "Files"],
                defaultGrouping: "Programming Languages",
                tooltipId: "#tooltip-language",
                renderTooltip: function(d, root) {
                    d3.select("#tooltip-language #language-name")
                        .text(d.parent['name']);
                    var sizePercentage = 100 * (d.parent.size / root.total_size);
                    d3.select("#tooltip-language #language-size")
                        .text(Humanize.fileSize(d.parent['size']) + " (" + sizePercentage.toFixed(2) + "%)");
                    var langPercentage = 100 * (d.parent.children.length / root.total_files);
                    d3.select("#tooltip-language #language-files")
                        .text(d.parent.children.length + " (" + langPercentage.toFixed(2) + "%)");
                    d3.select("#tooltip-language #language-file")
                        .text(d.name);
                    d3.select("#tooltip-language #language-file-size")
                        .text(Humanize.fileSize(d.size));
                },
                title: "Repository Languages",
                ncyBreadcrumbLabel: 'Programming Languages'
            }
        });

});

githubTreemapsApp.run(function($rootScope, $state, StateService) {
    $rootScope.$on('$stateChangeSuccess', function (e, toState, toParams, fromState, fromParams) {
        StateService.toState = toState;
        StateService.toParams = toParams;
        StateService.fromState = fromState;
        StateService.fromParams = fromParams;
        // State 'repository' should be abstract but can't to in order
        // to get a breadcrumb, forward automatically to 'repository.commits'
        if ($state.current.name == "repository") {
            $state.go('repository.commits', toParams);
        }

    });

    $rootScope.$on('stateChangeError ', function(event, toState, toParams, fromState, fromParams, error){
        console.log(error)
    });

    $(window).resize(_.debounce(function() {
        $rootScope.$apply(function() {
            $state.go($state.current, {}, {reload: true})
            ;
        });
    }, 250));
});

githubTreemapsApp.controller('MainCtrl', function ($scope, $state, $rootScope, StateService, $http) {
    $scope.reload = function() {
        $state.go($state.current, StateService.toParams, {reload: true});
    };

    $rootScope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
            $state.previous = fromState;
            $state.previousParams = fromParams;
            $rootScope.pageTitle = toState.data.title;
            // Hide all tooltips
            d3.selectAll('div[id^="tooltip-"]').classed("hidden", true);

            if (toState.name == "home") {
                // Fetch top repositories
                $http.get("https://api.github.com/search/repositories?q=stars:%3E0&sort=stars&order=desc", { cache: true })
                    .then(function(response) {
                        $scope.mostStarred =
                            _.first(_.map(response.data.items, function(item) {
                                return {id: item.id, name: item.full_name, description: item.description, stars: item.stargazers_count};
                            }), 10);
                    });

                $http.get("https://api.github.com/search/repositories?q=forks:%3E0&sort=forks&order=desc", { cache: true })
                    .then(function(response) {
                        $scope.mostForked =
                            _.first(_.map(response.data.items, function(item) {
                                return {id: item.id, name: item.full_name, description: item.description, forks: item.forks_count};
                            }), 10);
                    });
            }

    });
});

githubTreemapsApp.controller('BreadCrumbCtrl', function ($scope, $rootScope) {
    $scope.breadCrumbs = [];

    $rootScope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
            $scope.breadCrumbs = toState.data.breadcrumbs;
    });
});

githubTreemapsApp.controller('AlertCtrl', function($scope) {
    $scope.alerts = [];

    $scope.addAlert = function(alert) {
        $scope.alerts.push(alert);
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.$on('alert_added', function(event, args) { $scope.addAlert(args);});
});

githubTreemapsApp.service('AlertService', function ($rootScope) {
    this.addAlert = function(alert) {
        $rootScope.$broadcast('alert_added', alert);
    };
});

githubTreemapsApp.controller('InfoCtrl', function ($scope, $rootScope) {
    $rootScope.$on('info_updated', function(event, args) {
        $scope.infos = args.infos;
        $scope.info_name = args.name;
        $scope.info_link = args.link;
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if (fromState.name != toState.name) {
            $scope.infos = [];
            $scope.info_name = null;
            $scope.info_link = null;
        }
    });
});

githubTreemapsApp.controller('SettingsCtrl', function ($scope, $state, SettingsService, loadingIconService) {
    $scope.colorMode = {'mode': 'Ancestor'}

    $scope.$watch("colorMode.mode", function(newValue, oldValue) {
        SettingsService.currentColorMode = $scope.colorMode.mode;
        if (newValue != oldValue) {
            loadingIconService.start_animation();
            _.defer(function() {
                $state.go($state.current, {}, {reload: true});
            });
        }
    });

});

githubTreemapsApp.service('SettingsService', function () {
    var thisService =
    {
        currentColorMode: null
    };

    return thisService;
});


githubTreemapsApp.controller('SearchCtrl', function($scope, $http, $state, loadingIconService) {

    $scope.onSelect = function ($item, $model, $label) {
        $state.go('repository.commits', {'id': $item.id});
        $scope.customSelected = "";

    };

    $scope.getRepository = function(val) {
        return $http.get('http://github-treemap-api.elasticbeanstalk.com/search/repositories/' + val, {
        }).then(function(res){
            return res.data.results;
        });
    };

    $scope.$watch('loadingRepositories', function(value) {
        if (value) {
            loadingIconService.start_animation();
        } else {
            loadingIconService.stop_animation();
        }
    });


});

githubTreemapsApp.controller('BreadcrumbCtrl', function($scope, $state) {
    $scope.breadcrumbs = [];
    $scope.getBreadcrumbs = function() {
        //return $state.current.data.breadcrumbs;
        return $scope.breadcrumbs;
    };
});


githubTreemapsApp.controller('RepositoryNotIndexedCtrl', function ($scope, repositoryId, $http, AlertService, $state) {
    $scope.id = repositoryId;

    $scope.queueRepository = function() {
        $http.post('http://github-treemap-api.elasticbeanstalk.com/queue/' + repositoryId)
            .then(function(response)
            {
                if (response.status == 204) {
                    AlertService.addAlert({msg: 'Successfully queued repository ' + $scope.name + " for indexing", type: 'success'});
                } else {
                    AlertService.addAlert({msg: 'Failed to queue repository ' + $scope.name + " for indexing, try again later", type: 'danger'});
                }

                $state.go('home');
            },
            function(response)
            {
                AlertService.addAlert({msg: 'Failed to queue repository ' + $scope.name + " for indexing, try again later", type: 'danger'});
                $state.go('home');
            })
    }
});


githubTreemapsApp.controller('RepositoryCtrl', function (repositoryId, repositoryInfo, StateService, $scope, $stateParams, $rootScope, $state, TreemapService, loadingIconService, JSONService) {
    $scope.id = repositoryId;
    $scope.name = repositoryInfo.name;
    $scope.TreemapService = TreemapService;
    $scope.commitsToHierarchicalTree = function (data) {
        var commits = {};
        var totalCommitCount = 0;
        for (var commit in data.commits) {
            if (data.commits.hasOwnProperty(commit)) {
                totalCommitCount += 1;
                var c = {}

                c['name'] = commit;
                c['files'] = data.commits[commit]['files'];
                var additions = 0;
                var deletions = 0;
                var files = data.commits[commit]['files'];
                for (var f in files) {
                    additions += files[f]['additions'];
                    deletions += files[f]['deletions'];
                }
                c['lines'] = additions + deletions;
                c['additions'] = additions;
                c['deletions'] = deletions;
                c['commits'] = 1;
                c['author'] = data.commits[commit]['author'];
                c['author_id'] = data.commits[commit]['author_id'];
                c['id'] = commit;
                c['next_state'] = 'repository.commit';
                c['depth_name'] = 'commit'
                c['allow_zoom'] = false;
                c['time'] = data.commits[commit]['time'];
                if (!(commits[data.commits[commit]['author_id']])) {
                    commits[data.commits[commit]['author_id']] = [];
                }
                commits[data.commits[commit]['author_id']].push(c);
            }
        }
        var commits_list = [];
        for (var author_id in commits) {
            if (commits.hasOwnProperty(author_id)) {
                commits_list.push({
                    'name': commits[author_id][0]['author'],
                    'gravatar': commits[author_id][0]['gravatar'],
                    'id': author_id,
                    'depth_name': 'committer',
                    'next_state': 'repository.commits.committer',
                    'children': commits[author_id],
                    'allow_zoom': false,
                    'total_lines': _.reduce(commits[author_id], function(memo, i) {return memo + i['lines'];}, 0),
                    'total_additions': _.reduce(commits[author_id], function(memo, i) {return memo + i['additions'];}, 0),
                    'total_deletions': _.reduce(commits[author_id], function(memo, i) {return memo + i['deletions'];}, 0)
                });
            }
        }

        $scope.last_updated_at = data['last_updated_at'];
        $scope.commit_count = totalCommitCount;

        var ret = { 'name': 'Commits', 'allow_zoom': true, 'children': commits_list, 'total_commit_count': totalCommitCount};
        $scope.data = ret;

        return ret;
    }

    $scope.updateInfos = function() {
        if ($state.current.name == "repository.commits") {
            $rootScope.$broadcast('info_updated', {
                name: repositoryInfo['name'],
                link: 'https://github.com/' + repositoryInfo['name'],
                infos: [
                    { heading: 'Commits', value: $scope.commit_count},
                    { heading: "Description", value: repositoryInfo['description']},
                    { heading: "Statistics Updated", value: moment(new Date($scope.last_updated_at)).fromNow()}
                ]
            });
        } else if ($state.current.name == "repository.commits.committer") {
            var committer = $scope.findCommitter(StateService.toParams.committer, $scope.data);
            var committerName = $scope.findCommitterName(StateService.toParams.committer, $scope.data);

            $rootScope.$broadcast('info_updated', {
                name: committerName,
                link: 'https://github.com/search?type=Users&q=' + committerName,
                infos: [
                    { heading: 'Commits', value: committer.children.length},
                    { heading: 'Lines', value: committer.total_lines},
                    { heading: 'Additons', value: committer.total_additions},
                    { heading: 'Deletions', value: committer.total_deletions},
                    { heading: "Statistics Updated", value: moment(new Date($scope.last_updated_at)).fromNow()}
                ]
            });
        }
    }

    $scope.findCommitter = function(id, data) {
        for (var i = 0; i < data.children.length; ++i) {
            var c = data.children[i];
            if (c['id'] == id) {
                return c;
            }
        }

        return null;
    }

    $scope.findCommitterName = function(id, data) {
        var committer = $scope.findCommitter(id, data);
        if (committer) {
            return committer['name'].split(" <")[0]
        }

        return null;
    }

    $scope.$on('$viewContentLoaded', function (event) {
        loadingIconService.start_animation();
        if (StateService.toState != null && StateService.toState.name == "repository.commits.committer") {
            JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-commits.json", $scope.commitsToHierarchicalTree)
                .then(function(data) {
                    $scope.data = data;
                    $scope.committer = $scope.findCommitterName(StateService.toParams.committer, data);
                    $scope.TreemapService.draw(data, [StateService.toParams.committer]); //zoom);
                    $scope.updateInfos();
                    loadingIconService.stop_animation();
                })
        } else {
            JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-commits.json", $scope.commitsToHierarchicalTree)
                .then(function(data) {
                    $scope.data = data;
                    $scope.TreemapService.draw(data, []); //zoom);
                    $scope.updateInfos();
                    loadingIconService.stop_animation();
                })
        }
    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if ((fromState == "repository.commits" || fromState == "repository.commits.committer") &&
            (toState == "repository.commits" || toState == "repository.commits.committer") &&
            fromParams.id != toParams.id) {
            loadingIconService.start_animation();
            if (toState.name == "repository.commits.committer") {
                JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-commits.json", $scope.commitsToHierarchicalTree)
                    .then(function(data) {
                        $scope.data = data;
                        $scope.TreemapService.draw(data, [StateService.toParams.committer]); //zoom);
                        loadingIconService.stop_animation();
                    });
            } else {
                JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-commits.json", $scope.commitsToHierarchicalTree)
                    .then(function(data) {
                        $scope.data = data;
                        $scope.TreemapService.draw(data, []); //zoom);
                        loadingIconService.stop_animation();
                    });
            }
        }
        else {
            if (fromState.name == "repository.commits.committer" &&
                toState.name == "repository.commits") {
                $scope.committer = null;
                loadingIconService.start_animation();
                $scope.TreemapService.zoomOut();
                loadingIconService.stop_animation();
            } else if (fromState.name == "repository.commits" &&
                toState.name == "repository.commits.committer") {
                loadingIconService.start_animation();
                $scope.TreemapService.zoomTo(toParams.committer);
                $scope.committer = $scope.findCommitterName(StateService.toParams.committer, $scope.data);
                loadingIconService.stop_animation();
            }
        }

        if (toState.name == "repository.commits" || toState.name == "repository.commits.committer") {
            $scope.updateInfos();
        }
    });


});

githubTreemapsApp.controller('RepositoryTreeCtrl', function (repositoryId, repositoryInfo, StateService, $scope, $stateParams, $rootScope, $state, TreemapService, loadingIconService, JSONService) {
    $scope.id = repositoryId;
    $scope.TreemapService = TreemapService;

    $scope.filesToHierarchicalTree = function (data) {
        $scope.name = data['name']
        var files = 0;
        var getChildren = function(item) {
            var ret = [];
            var size = 0;
            if (item.files) {
                for (var i in item.files) {
                    if (item.files.hasOwnProperty(i)) {
                        var curI = {};
                        curI['name'] = i;
                        var children = getChildren(item.files[i]);
                        curI['children'] = children.children;
                        curI['depth_name'] = "path";
                        curI['incr_param'] = true;
                        curI['id'] = "/" + i;
                        if (item.files[i].size) {
                            curI['size'] = item.files[i].size;
                            size += item.files[i].size;
                            curI['allow_zoom'] = false;
                            curI['files'] = 1;
                            files += 1;
                        } else {
                            curI['allow_zoom'] = true;
                            curI['next_state'] = "repository.tree.zoom";
                            curI['size'] = children.size;
                            size += children.size;
                        }

                        ret.push(curI);
                    }

                }
            }

            return {'children': ret, 'size': size};
        };
        var children = getChildren(data);
        var ret = { 'name': data['name'], 'allow_zoom': true, 'size': children.size,
            'next_state': "repository.tree.zoom", "depth_name": "path",
            'incr_param': true, 'id': "", 'children': children.children};
        $scope.data = ret;
        $scope.last_updated_at = data['last_updated_at'];
        $scope.files = files;
        $scope.size = children.size;
        $scope.updateInfos();
        return { 'name': data['name'], 'allow_zoom': true, 'size': children.size, 'next_state': "repository.tree.zoom", "depth_name": "path", 'incr_param': true, 'id': "", 'children': children.children};
    }

    $scope.$on('$viewContentLoaded', function (event) {
        loadingIconService.start_animation();
        if (StateService.toState != null && StateService.toState.name == "repository.tree.zoom") {
            var pathParts = StateService.toParams.path.split("/");
            JSONService.getAndFlatten($scope.id + "-files.json", $scope.filesToHierarchicalTree)
                .then(function(data) {
                    $scope.TreemapService.draw(data, _.map(pathParts.slice(1), function(i){ return "/" + i; }));
                    loadingIconService.stop_animation();
                });
        } else {
            JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-files.json", $scope.filesToHierarchicalTree)
                .then(function(data) {
                    $scope.TreemapService.draw(data, []); //zoom);
                    loadingIconService.stop_animation();
                });
        }
    });

    $scope.getPathSize = function(path) {
        var pathParts = _.map(path.split("/").slice(1), function(i){ return "/" + i; });

        var i = 0;
        var curNode = $scope.data;
        while (true) {
            var found = false;
            for (var j = 0; j < curNode.children.length; ++j) {
                if (curNode.children[j]['id'] == pathParts[i]) {
                    found = true;
                    if (i == pathParts.length - 1) {
                        return curNode.children[j]['size'];
                    }
                    i += 1;
                    curNode = curNode.children[j];
                    continue;
                }
            }
            if (!found) {
                return 0;
            }
        }

        return 0;
    }

    $scope.updateInfos = function() {
        if ($state.current.name == "repository.tree") {
            $rootScope.$broadcast('info_updated', {
                name: repositoryInfo['name'],
                link: 'https://github.com/' + repositoryInfo['name'] + '/tree/master',
                infos: [
                    { heading: "Description", value: repositoryInfo['description']},
                    { heading: 'Size', value: Humanize.fileSize($scope.size)},
                    { heading: 'Files', value: $scope.files},
                    { heading: "Statistics Updated", value: moment(new Date($scope.last_updated_at)).fromNow()}]
            });
        } else if ($state.current.name == "repository.tree.zoom") {
            $rootScope.$broadcast('info_updated', {
                name: repositoryInfo['name'] + StateService.toParams.path,
                link: 'https://github.com/' + repositoryInfo['name'] + '/tree/master' + StateService.toParams.path,
                infos: [
                    { heading: "Description", value: repositoryInfo['description']},
                    { heading: 'Size', value: Humanize.fileSize($scope.getPathSize(StateService.toParams.path))},
                    { heading: "Statistics Updated", value: moment(new Date($scope.last_updated_at)).fromNow()}]
            });
        }
    }

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        loadingIconService.start_animation();
        // Overly complex logic to avoid unnecessary draws
        if (fromState.name == "repository.tree.zoom" &&
            toState.name == "repository.tree") {
            TreemapService.zoomOut();
        } else if (fromState.name == "repository.tree.zoom" &&
                   toState.name == "repository.tree.zoom") {
            if (fromParams.path && toParams.path && fromParams.path.indexOf(toParams.path) == 0) {
                var howManyStepsUp = fromParams.path.replace(toParams.path, '').split("/").length - 1;
                for (var i = 0; i < howManyStepsUp; ++i) {
                    TreemapService.zoomUp();
                }
            } else if (fromParams.path && toParams.path && toParams.path.indexOf(fromParams.path) == 0) {
                var stepsDown = toParams.path.replace(fromParams.path, '').split("/");
                for (var i = 0; i < stepsDown.length; ++i) {
                    TreemapService.zoomTo("/" + stepsDown[i]);
                }
            }
            else {
                if (fromState.name != "repository.tree" && fromState.name != "repository.tree.zoom") {
                    var pathParts = StateService.toParams.path ? StateService.toParams.path.split("/") : [];
                    JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-files.json", $scope.filesToHierarchicalTree)
                        .then(function(data) {
                            $scope.TreemapService.draw(data, _.map(pathParts.slice(1), function (i) {
                                return "/" + i;}));
                            loadingIconService.stop_animation();
                        });
                } else {
                    TreemapService.zoomOut();
                    var stepsDown = toParams.path.split("/");
                    for (var i = 0; i < stepsDown.length; ++i) {
                        TreemapService.zoomTo("/" + stepsDown[i]);
                    }
                }
            }
        } else if (fromState.name == "repository.tree" &&
                   toState.name == "repository.tree.zoom") {
            var stepsDown = toParams.path.replace(fromParams.path, '').split("/");
            for (var i = 0; i < stepsDown.length; ++i) {
                TreemapService.zoomTo("/" + stepsDown[i]);
            }
        }

        if (toState.name == "repository.tree" || toState.name == "repository.tree.zoom") {
            $scope.updateInfos();
        }
    });

});

githubTreemapsApp.controller('CommitCtrl', function (repositoryId, repositoryInfo, $scope, $rootScope, $state, TreemapService, JSONService, loadingIconService) {
    $scope.id = repositoryId;
    $scope.commitId = $state.params.commit;
    $scope.TreemapService = TreemapService;
    $scope.name = repositoryInfo.name;
    $scope.dataToHierarchicalTree = function (data) {
        var additions = 0;
        var deletions = 0;
        var files = [];
        var commit = data.commits[$scope.commitId];
        for (var f in commit.files) {
            if (commit.files.hasOwnProperty(f)) {

                var cur_file = commit.files[f];
                cur_file['name'] = f;
                cur_file['lines'] = cur_file['additions'] + cur_file['deletions'];
                additions += cur_file['additions'];
                deletions += cur_file['deletions'];
                files.push(cur_file);
            }
        }
        var ret = { 'name': $scope.commitId, 'children': files, 'allow_zoom': false};
        $scope.data = ret;
        $scope.additions = additions;
        $scope.deletions = deletions;
        $scope.time = commit.time;
        return ret;
    }

    $scope.$on('$viewContentLoaded', function () {
        JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-commits.json", $scope.dataToHierarchicalTree)
            .then(function(data) {
                $scope.TreemapService.draw(data, []);
                $rootScope.$broadcast('info_updated', {
                    name: $scope.commitId.substr(0, 16),
                    link: 'https://github.com/' + repositoryInfo['name'] + '/commit/' + $scope.commitId,
                    infos: [
                        { heading: "Time", value: moment(new Date($scope.time * 1000)).fromNow()},
                        { heading: "Lines", value: $scope.additions + $scope.deletions},
                        { heading: 'Additions', value: $scope.additions},
                        { heading: "Deletions", value: $scope.deletions},
                        { heading: "Files", value: $scope.data.children.length}]
                });

                loadingIconService.stop_animation();
            });


    });
});

githubTreemapsApp.controller('LanguageCtrl', function (repositoryId, repositoryInfo, $scope, $rootScope, $state, TreemapService, JSONService, loadingIconService) {
    $scope.id = repositoryId;
    $scope.TreemapService = TreemapService;
    $scope.name = repositoryInfo.name;
    $scope.dataToHierarchicalTree = function (data) {
        var getChildren = function(res, item) {
            if (item.files) {
                for (var i in item.files) {
                    if (item.files.hasOwnProperty(i)) {
                        if (item.files[i].size) {
                            var programmingLanguage = getProgrammingLanguage(i);
                            if (!(programmingLanguage in res)) {
                                res[programmingLanguage] = {'name': programmingLanguage, children: [], size: 0}
                            }

                            res[programmingLanguage].children.push(
                                {
                                    'name': i,
                                    'size': item.files[i].size,
                                    'files': 1,
                                    'allow_zoom': false
                                });
                            res[programmingLanguage].size += item.files[i].size;
                        } else {
                            getChildren(res, item.files[i]);
                        }
                    }
                }
            }
        }

        var res = {};
        getChildren(res, data);
        var languages = _.map(res, function(files, language) { return {name: language, size: files.size, children: files.children}});
        var totalSize = _.reduce(languages, function(memo, lang) { return memo + lang.size;}, 0);
        var totalFileCount = _.reduce(languages, function(memo, lang) { return memo + lang.children.length}, 0);
        var ret = {name: "Programming languages", children: languages, total_size: totalSize, total_files: totalFileCount};
        $scope.last_updated_at = data.last_updated_at;
        $scope.hierData = ret;
        $scope.total_files = totalFileCount;
        $scope.total_size = totalSize;
        return ret;
    }

    $scope.$on('$viewContentLoaded', function () {
        JSONService.getAndFlatten($scope.version + "-" + $scope.id + "-files.json", $scope.dataToHierarchicalTree)
            .then(function(data) {
                $scope.TreemapService.draw(data, []);
                $rootScope.$broadcast('info_updated', {
                    name: repositoryInfo['name'],
                    link: 'https://github.com/' + repositoryInfo['name'],
                    infos: [
                        { heading: "Languages", value: $scope.hierData.children.length},
                        { heading: 'Size', value: Humanize.fileSize($scope.total_size)},
                        { heading: 'Files', value: $scope.total_files},
                        { heading: "Statistics Updated", value: moment(new Date($scope.last_updated_at)).fromNow()}
                        ]

                });

                loadingIconService.stop_animation();
            });


    });
});

githubTreemapsApp.controller('SummandsCtrl', function ($scope, SummandService) {
    $scope.setSummand = function (summand) {
        $scope.chosenSummand = summand.toLowerCase();
        SummandService.summandChanged($scope.chosenSummand);
    };

    $scope.$on('summands_updated',
        function (event, summands) {
            if (summands) {
                $scope.summands = summands;
                if (summands.length > 0) {
                    if (summands[0] != $scope.chosenSummand) {
                        $scope.chosenSummand = summands[0].toLowerCase();
                    }
                }
            }
        }
    );

    $scope.$watch('chosenSummand', function () {
        SummandService.summandChanged($scope.chosenSummand);
    });
});

githubTreemapsApp.controller('GroupingCtrl', function ($scope, GroupingService) {
    $scope.ignoreNextUpdate = false;
    $scope.$on('groupings_updated',
        function (event, args) {
            $scope.groupings = args['groupings'];
            if (args['defaultGrouping']) {
                if (args['defaultGrouping'] != $scope.chosenGrouping) {
                    $scope.ignoreNextUpdate = true;
                    $scope.chosenGrouping = args['defaultGrouping'];
                }
            }
        }
    );

    $scope.$watch('chosenGrouping', function (newValue, oldValue) {
        if ($scope.ignoreNextUpdate) {
            $scope.ignoreNextUpdate = false;
            return;
        }
        if (newValue != oldValue) {
            GroupingService.groupingChanged($scope.chosenGrouping);
        }
    });
});

githubTreemapsApp.service('JSONService', function($http, $state) {
    this.getAndFlatten = function(json, dataToHierarchicalTree) {
        return $http.get('http://d2kedfdzrv5j4k.cloudfront.net/' + json + '.gz')
                .then(function (data) {
                    return dataToHierarchicalTree(data.data);
                }, function (error) {
                    $state.go('repository.not-indexed-error');
                });
    }
});

githubTreemapsApp.service('loadingIconService', function () {
    var $icon = $(".glyphicon.glyphicon-refresh"),
        animateClass = "glyphicon-refresh-animate";
    this.start_animation = function () {
        if (!$icon.hasClass(animateClass)) {
            $icon.addClass(animateClass);
        }
    };

    this.stop_animation = function () {
        if ($icon.hasClass(animateClass)) {
            $icon.removeClass(animateClass);
        }
    };
});


githubTreemapsApp.service('StateService', function ($rootScope) {
    var thisService =
        {
            toState: null,
            toParams: null,
            fromState: null,
            fromParams: null
    };

    return thisService;
});

githubTreemapsApp.service('PathService', function ($state, $rootScope, $location) {

    this.mustGoDeeper = function (next_state, key, value) {
        var variable = {}
        variable[key] = value;
        $rootScope.$apply(function() { $state.go(next_state, variable) });;
    };
});

githubTreemapsApp.service('SummandService', function ($rootScope, $state, loadingIconService) {
    var thisService =
        {
            currentSummand: "",
            allSummands: [],

            summandChanged: function (summand) {
                thisService.currentSummand = summand;
                loadingIconService.start_animation();
                _.defer(function() {
                    $rootScope.$broadcast('current_summand_updated', summand);
                    loadingIconService.stop_animation();
                });
            },

            getCurrentSummand: function () {
                return thisService.currentSummand;
            }
        };

    $rootScope.$on('$stateChangeSuccess', function() {
        thisService.allSummands = $state.current.data.summands;
        $rootScope.$broadcast('summands_updated', thisService.allSummands);
    });

    return thisService;
});

githubTreemapsApp.service('GroupingService', function ($rootScope, $state, loadingIconService) {

    var thisService =
        {
            groupingChanged: function (grouping) {
                var toState = $state.current.data.groupToStateMapping[grouping];
                if (toState) {
                    loadingIconService.start_animation();
                    _.defer(function() {$rootScope.$apply(function() { $state.go(toState); })});
                }

            }
        };

    $rootScope.$on('$stateChangeSuccess', function() {
        $rootScope.$broadcast('groupings_updated',
            { "groupings": $state.current.data.groupings, "defaultGrouping": $state.current.data.defaultGrouping});
    });

    return thisService;
});

githubTreemapsApp.service('TreemapService', function ($rootScope, $state, $filter, PathService, SummandService, StateService, SettingsService) {
    var thisService =
    {
        w: null,
        h: null,
        x: null,
        currentNode: null,
        rootNode: null,
        svg: null,
        draw: function (data_json, zoomLevel) {
            function get_size_function() {
                return function (row) {
                    var summand = SummandService.getCurrentSummand();
                    return row[summand];
                };
            }

            thisService.w = $(".chart").width();
            thisService.h = $(".chart").height();
            thisService.x = d3.scale.linear().range([0, thisService.w]);
            thisService.y = d3.scale.linear().range([0, thisService.h]);
            thisService.color = d3.scale.category20c();
            _.defer(function() {
                var treemap = d3.layout.treemap()
                    .round(true)
                    .size([thisService.w, thisService.h])
                    .sticky(false)
                    .value(get_size_function());
                thisService.svg = d3.select(".chart")
                    .append("svg:svg")
                    .attr("viewBox", "0 0 " + thisService.w + " " + thisService.h)
                    .attr("preserveAspectRatio", "xMinYMax")
                    .append("svg:g")
                    .attr("transform", "translate(.5,.5)");

                thisService.currentNode = thisService.rootNode = data_json;
                var nodes = treemap.nodes(thisService.rootNode).filter(function (d) {
                    return !d.children;
                });

                _.defer(function () {
                    var cell = thisService.svg.selectAll("g")
                        .data(nodes).enter()
                        .append("svg:g")
                        .attr("class", "cell")
                        .attr("transform", function (d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        }).on("click",
                        function (d) {
                            var curNode = d;
                            if (thisService.currentNode.allow_zoom) {
                                while (curNode) {
                                    if (curNode.parent == thisService.currentNode) {
                                        //thisService.zoom(curNode);
                                        break;
                                    }
                                    curNode = curNode.parent;
                                }
                            }
                            if (curNode != null && curNode['next_state']) {
                                if (curNode['incr_param']) {
                                    var currentParams = StateService.toParams[curNode['depth_name']] ? StateService.toParams[curNode['depth_name']] : "";
                                    PathService.mustGoDeeper(curNode['next_state'], curNode['depth_name'], currentParams + curNode['id']);
                                } else {
                                    PathService.mustGoDeeper(curNode['next_state'], curNode['depth_name'], curNode['id']);
                                }
                            }

                        }).on("mousemove", function (d) {
                            _.throttle(function (d) {
                                var xPosition = d3.event.pageX + 5;
                                var yPosition = d3.event.pageY + 5;

                                $state.current.data.renderTooltip(d, thisService.rootNode, thisService.currentNode);

                                var tooltipSize = thisService.hiddenElementSize($state.current.data.tooltipId);
                                if (tooltipSize.height == 0) {
                                    return;
                                }
                                xPosition = Math.min(window.innerWidth - tooltipSize.width - 10, xPosition);
                                yPosition = Math.min(window.innerHeight - tooltipSize.height - 20, yPosition);

                                d3.select($state.current.data.tooltipId)
                                    .style("left", xPosition + "px")
                                    .style("top", yPosition + "px");

                                d3.select($state.current.data.tooltipId).classed("hidden", false);
                            }, 50)(d);
                        })
                        .on("mouseout", function (d) {
                            d3.select($state.current.data.tooltipId).classed("hidden", true);
                        });
                    _.defer(function () {
                        cell.append("svg:rect").attr("width", function (d) {
                            return Math.max(0, d.dx - 1);
                        }).attr("height", function (d) {
                            return Math.max(0, d.dy - 1);
                        }).style("fill", thisService.generateColor);

                        $rootScope.$on('current_summand_updated', function (value) {
                            treemap.value(get_size_function()).nodes(thisService.rootNode);
                            thisService.zoom(thisService.currentNode);

                        });

                        _.defer(function () {
                            for (var i = 0; i < zoomLevel.length; ++i) {
                                var id = zoomLevel[i];
                                thisService.zoomTo(id);
                            }

                        });
                    });
                });
            });

        },
        zoomOut: function() {
            thisService.zoom(thisService.rootNode);
        },
        zoomUp: function() {
            if (thisService.currentNode.parent) {
                thisService.zoom(thisService.currentNode.parent);
            }
        },
        zoomTo: function(id) {
            if (thisService.currentNode.children) {
                for (var i = 0; i < thisService.currentNode.children.length; ++i) {
                    var c = thisService.currentNode.children[i];
                    if (c.id === id) {
                        thisService.zoom(c);
                        break;
                    }
                }
            }
        },
        zoom: function (d) {

                thisService.currentNode = d;
                var kx = thisService.w / d.dx,
                    ky = thisService.h / d.dy;
                thisService.x.domain([d.x, d.x + d.dx]);
                thisService.y.domain([d.y, d.y + d.dy]);
                var t = thisService.svg
                    .selectAll("g.cell")
                    .attr("transform", function (d) {
                        return "translate(" + thisService.x(d.x) + "," + thisService.y(d.y) + ")";
                    });

                t.select("rect").attr("width", function (d) {
                    return Math.max(0, kx * d.dx - 1);
                }).attr("height", function (d) {
                    return Math.max(0, ky * d.dy - 1);
                }).style("fill", thisService.generateColor);;



                if (d3.event) {
                    d3.event.stopPropagation();
                }

            },
            generateColor: function (d) {
                    if (SettingsService.currentColorMode == "Ancestor") {
                        var grandParents = [];
                        var grandParent = d.parent;
                        if (grandParent == thisService.currentNode) {
                            return thisService.color(d.name);
                        }
                        while (grandParent.parent && grandParent != thisService.currentNode) {
                            grandParents.push(grandParent);
                            grandParent = grandParent.parent;
                        }
                        if (grandParents.length < 1) {
                            return thisService.color(grandParent.name);
                        } else {
                            return thisService.color(grandParents[grandParents.length - 1].name);
                        }
                    } else if (SettingsService.currentColorMode == "Parent") {
                        return thisService.color(d.parent.name);
                    }
        },
        hiddenElementSize: function(id) {
            var ret = {};
            $(id)
                .css({
                    visibility: 'hidden',
                    display:    'block'
                })
                .removeClass("hidden");

            ret['height'] = $(id).height();
            ret['width'] = $(id).width();

            $(id)
                .addClass("hidden")
                .removeAttr('style');

            return ret;
        }
    }

    return thisService;
});