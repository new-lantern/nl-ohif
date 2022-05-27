local pipelineCommon = {
  kind: 'pipeline',
  type: 'docker',
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


local deployCommon = pipelineCommon {
  trigger: {
    branch: [
      'feat/ci-cd',
    ],
    event: [
      'push',
    ],
  },
  steps: [
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
  deployCommon,
]
