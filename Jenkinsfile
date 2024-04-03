pipeline{
  agent any

  environment{
    IMAGE_TAG = "${BUILD_NMBER}"
    dock_user = credentials('DOC_USER')
    dock_pass = credentials('DOC_PASS')
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

              cd /var/jenkins_home/workspace/small-scale-urban-service-pipelines/

              docker-compose up -d
              docker-compose up -d             

            '''
        }
      }
   }

  stage("Pushing the code to the HUB"){
      steps{
        script{
            sh '''
              echo "****************  Pushing the code into Docker Hub ***************"
              
              docker tag django-ui:latest  sid716/djangoui-ssus:${BUILD_NUMBER}

              docker login -u dock_user -p dock_pass

              docker push sid716/djangoui-ssus:${BUILD_NUMBER} 

            '''
        }
      }
  }
  
  stage("Checkout to the Deployment K8S SCM"){
      steps{
        script{
          git branch: 'main'
            credentialsId: 'damdamYO'
            url: 'https://github.com/sid14581/Deployment-Small-scale-Urban-Services.git'
        }
      }
  }  

}
}