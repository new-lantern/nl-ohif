local pipelineCommon = {
  kind: 'pipeline',
  type: 'docker',
};

local jsStepCommon = {
  image: 'node:14',
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

local slackDeployMessage = {
  name: 'slack',
  image: 'plugins/slack',
  settings: {
    webhook: {
      from_secret: 'TEST_WEBHOOK',
    },
    icon_url: 'https://iconape.com/wp-content/png_logo_vector/drone.png',
    channel: 'ci-cd-test',
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

local mainPipeline = pipelineCommon {
  name: 'main',
  trigger: {
    event: [
      'push',
    ],
  },
  steps: [
    restoreCache,
  ],
};

local deployCommon = pipelineCommon {
  depends_on: [
    'main',
  ],
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

local deployProduction = deployCommon {
  trigger: {
    branch: [
      'feat/ci-cd',
    ],
    event: [
      'push',
    ],
  },
  steps: [
    jsStepCommon {
      name: 'deploy-production',
      environment: {
        NAME: '@newlantern/viewer',
        ENTRY: 'index.umd.js',
        REPO: 'https://github.com/new-lantern/nl-ohif',
        LISCENSE: 'MIT',
      },
      commands: [
        'cd platform/viewer',
        'yarn',
        'yarn prepare',
        'cd dist',
        'VERSION=$(npm view @newlantern/viewer version)',
        'echo "{\n"\
          "\"name\": \"@newlantern/viewer\",\n"\
          "\"version\": \"4.4.4\",\n"\
          "\"main\": \"index.umd.js\",\n"\
          "\"repository\": \"https://github.com/new-lantern/nl-ohif\",\n"\
          "\"license\": \"MIT\"\n"\
        "}" >> package.json',
        'cat package.json',
      ],
    },
    slackDeployMessage,
  ],
};


[
  mainPipeline,
  deployProduction,
]

echo "{\n"\
  "\"name\": \"@newlantern/viewer\",\n"\
  "\"version\": \"4.4.4\",\n"\
  "\"main\": \"index.umd.js\",\n"\
  "\"repository\": \"https://github.com/new-lantern/nl-ohif\",\n"\
  "\"license\": \"MIT\"\n"\
"}"
