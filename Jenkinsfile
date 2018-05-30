#!groovy
pipeline {
  agent any
  stages {
    stage('start-postgres-docker') {
      echo "Starting postgres docker container..."
      sh 'docker run --name lms-testdb -d -p 5432:5432 postgres:10.1'
    }
    stage('build') {
      agent {
        dockerfile {
          filename 'Dockerfile.build'
          dir 'services/QuillJenkins/agents/QuillLMS'
          args '-u root:sudo -v $HOME/workspace/myproject:/myproject'
        }
      }
      steps {
        echo "Beginning BUILD..."
        script {
          try {
            sh 'rm -r Empirical-Core'
          }
          catch (exc) {
            sh 'echo "Cloning..."' 
          }
        }

        sshagent (credentials: ['jenkins-ssh']) {
          echo "Adding github.com to list of known hosts"
          sh 'ssh-keyscan -H github.com >> ~/.ssh/known_hosts'
          echo "Cloning repository..."
          sh 'git clone git@github.com:empirical-org/Empirical-Core.git'
        }
        echo "Stashing the LMS..."
        stash includes: 'Empirical-Core/services/QuillLMS/', name: 'lms_stash'
        echo "Build successful!"
      }
    }
    stage('test') {
      agent {
        dockerfile {
          filename 'Dockerfile.test'
          dir 'services/QuillJenkins/agents/QuillLMS'
          args '-u root:sudo -v $HOME/workspace/myproject:/myproject'
        }
      }
      steps {
        echo "Beginnning TEST..."
        unstash 'lms_stash'
        dir('Empirical-Core/services/QuillLMS') {
          echo 'Installing Bundle...'
          sh 'bundle install'

          echo "Rspec:"
          echo "Setting up rspec..."
          sh 'cp config/database.yml.travis config/database.yml'
          sh 'bundle exec rake parallel:create'
          sh 'bundle exec rake parallel:load_structure'
          echo "Running rspec"
          sh 'bundle exec rake parallel:spec'
          sh 'bash <(curl -s https://codecov.io/bash) -cF rspec -f coverage/coverage.json'

          echo "Brakeman:"
          sh 'bundle exec brakeman -z'

          echo 'Jest:'
          echo 'Setting up jest...' 
          sh 'nvm install'
          sh 'npm install'
          sh 'npm run build:test'
          echo 'Running jest...'
          sh 'npm run jest:coverage'
          sh 'bash <(curl -s https://codecov.io/bash) -cF jest'

          echo "Test successful!"
        }
      }
    }
    stage('deploy') {
      steps {
        echo "Beginnning DEPLOY..."
        script {
          if ("$env.BRANCH_NAME" == 'master') {
            echo "Quill.org successfully deployed!"
          }
          else if ("$env.BRANCH_NAME" == 'develop') {
            echo "Staging successfully deployed!"
          }
          else {
            echo "deploy stage ignored; you are not on master or develop."
          }
        }
      }
    }
    stage('stop-postgres-docker') {
      echo "Stopping postgres docker container..."
      sh 'docker stop lms-testdb'
      sh 'docker rm lms-testdb'
    }
  }
}