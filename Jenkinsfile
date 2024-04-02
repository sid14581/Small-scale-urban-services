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

              cd /var/jenkins_home/workspace/small-scale-urban-service-pipelines/

              docker-compose up -d

            '''
        }
      }
   }

   
  // stage("Building the code image"){
  //   steps{
  //     script{
  //         sh '''
  //             echo ' '
  //             echo '************************ Building the Code*****************************'                  
  //           '''
  //       }
  //     }
  //  }
  


  // stage("Pushing the code to the HUB"){
  //     steps{
  //       script{
            
  //       }
  //     }
  // }

  // stage("Checkout to the Deployment K8S SCM"){
  //     steps{
  //       script{
  //         git branch: 'main'
  //           credentialsId: 'damdamYO'
  //           url: 'https://github.com/sid14581/Deployment-Small-scale-Urban-Services.git'
  //       }
  //     }
  // }

  // stage("Updating the K*S Manifest files and updating the Repo."){
  //     steps{
  //       script{
  //           withCredentials(){
  //             sh '''
  //             cd /var/jenkins_home/workspace/small-scale-urban-service-pipelines/deploy/
  //             cat deploy.yaml

  //             git add deploy.yaml

  //             git commit -m 'Updated  the deploy.yaml file'
  //             echo " "
  //             git remote -v
  //             echo " "
                        
  //             git push origin  https://${GITHUB_TOKEN}@github.com/sid14581/Deployment-Small-scale-Urban-Services.git HEAD:main
  //             '''
  //           }
  //       }
  //     }
  // }

}
}