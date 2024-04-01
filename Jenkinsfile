pipeline{
  agent any

  environment{
    IMAGE_TAG = "${BUILD_NMBER}"
  }

  stages{
//    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
   stage("Checkout from Application Repo."){
      steps{
        script{
            git branch: 'main',
              credentialsId: 'damdamYO',
              url: 'https://github.com/sid14581/Small-scale-urban-services.git'
        }
      }
   }
   
   stage("Building the code"){
      steps{
        script{
            
        }
      }
   }
  }

  stage("Pushing the code to the HUB"){
      steps{
        script{
            
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

  stage("Updating the K*S Manifest files and updating the Repo."){
      steps{
        script{
            
        }
      }
  }
}