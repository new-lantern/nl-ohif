local pipelineCommon = {
  kind: 'pipeline',
  type: 'docker',
};

local jsStepCommon = {
  image: 'node:14',
};

local slackDeployMessage = {
  name: 'slack',
  image: 'plugins/slack',
  settings: {
    webhook: 'https://hooks.slack.com/services/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',
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
    jsStepCommon {
      name: 'lint',
      commands: ['npm run-script lint'],
    },
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
    deployCommon.steps[0],
    {
      name: 'deploy',
      image: 'danihodovic/ansible',
      environment: {
        SSH_KEY: {
          from_secret: 'deployment_ssh_key',
        },
        VAULT_KEY: {
          from_secret: 'vault_key',
        },
      },
      commands: [
        'echo hello_world',
      ],
    },
    slackDeployMessage,
  ],
};


[
  mainPipeline,
  deployProduction,
]
