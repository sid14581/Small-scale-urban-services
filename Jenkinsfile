pipeline{
  agent any

  environment{
    IMAGE_TAG = "${BUILD_NMBER}"

  }
 // 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
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



}
}