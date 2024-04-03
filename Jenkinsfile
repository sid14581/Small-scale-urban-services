pipeline{
  agent any

  environment{
    IMAGE_TAG = "${BUILD_NMBER}"

  }

  stages{

   stage("Checkout from Application Repo."){
      steps{
        script{
            git branch: 'main',
              credentialsId: 'damdamYO',
              url: 'https://github.com/sid14581/Small-scale-urban-services.git'
        }
      }
   }

stage("Building the code image"){
    steps{
      script{
          sh '''
              echo ' '
              echo '************************ Building the Code*****************************'   

              USER root
              chown 1000:1000 -R /var/run/docker.sock
              USER jenkins
              
              cd /var/jenkins_home/workspace/small-scale-urban-service-pipelines/

              docker-compose up -d
              docker-compose up -d
              

            '''
        }
      }
   }


}
}