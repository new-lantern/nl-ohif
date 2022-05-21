local pipelineCommon = {
  kind: 'pipeline',
  type: 'docker',
};

local cacheCommon = {
  image: 'danihodovic/drone-cache',
  settings: {
    backend: 'gcs',
    bucket: 'newlantern-drone-ci-bucket',
    cache_key: '{{ .Repo.Name }}_{{ checksum "yarn.lock" }}',
    mount: ['.npm'],
  },
};

local restoreCache = cacheCommon {
  name: 'restore-cache',
  settings+: {
    restore: true,
  },
};

local rebuildCache = cacheCommon {
  name: 'rebuild-cache',
  depends_on: ['install-deps'],
  settings+: {
    rebuild: true,
  },
};

local jsStepCommon = {
  image: 'node:14',
};

local mainPipeline = pipelineCommon {
  name: 'main',
  trigger: {
    event: [
      'push',
    ],
  },
  steps: [
    restoreCache,
    jsStepCommon {
      name: 'install-deps',
      depends_on: ['restore-cache'],
      commands: [
        'yarn config set yarn-offline-mirror $PWD/.npm',
        'yarn --prefer-offline  --frozen-lockfile',
      ],
    },
    jsStepCommon {
      name: 'lint',
      depends_on: ['install-deps'],
      commands: ['npm run-script lint'],
    },
    rebuildCache,
  ],
};


local slackDeployMessage = {
  name: 'slack',
  image: 'plugins/slack',
  settings: {
    webhook: 'https://hooks.slack.com/services/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',
    icon_url: 'https://iconape.com/wp-content/png_logo_vector/drone.png',
    channel: 'deployments',
    username: 'Drone',
    template: |||
      {{#success build.status}}
        {{ build.author }} has deployed {{ repo.name }} to {{ build.deployTo }}
        https://github.com/{{ repo.owner }}/{{ repo.name }}/commit/{{ build.commit }}
      {{else}}
        {{ repo.name }} failed to deploy.
        {{ build.link }}
      {{/success}}
    |||,
  },
};


local deployCommon = pipelineCommon {
  depends_on: [
    'main',
  ],
  trigger: {
    event: [
      'promote',
    ],
  },
  steps: [
    {
      name: 'deploy',
      image: 'honeylogic/tanka',
      environment: {
        AGE_PRIVATE_KEY: {
          from_secret: 'AGE_PRIVATE_KEY',
        },
      },
      commands: [
        'export GIT_COMMIT=$(git rev-parse --short HEAD)',
        'git clone https://github.com/new-lantern/nl-ops.git',
        'cd nl-ops',
        'echo $AGE_PRIVATE_KEY > ~/.config/sops/age/keys.txt',
      ],
    },
  ],
};

local deployStagingPipeline = deployCommon {
  name: 'deploy-staging',
  trigger: {
    target+: 'staging',
  },
  steps: [deployCommon.steps[0] {
    commands+: [
      'task apply-staging -- tanka/environments/staging/nl_pacs.jsonnet $GIT_COMMIT',
    ],
  }, slackDeployMessage],
};

local deployProductionPipeline = deployCommon {
  name: 'deploy-production',
  trigger: {
    target+: 'production',
  },
  steps: [deployCommon.steps[0] {
    commands+: [
      'task apply-prod -- tanka/environments/production/nl_pacs.jsonnet $GIT_COMMIT',
    ],
  }, slackDeployMessage],
};

[
  mainPipeline,
  deployStagingPipeline,
  deployProductionPipeline,
]
