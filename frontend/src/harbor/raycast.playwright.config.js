import {defineConfig} from '@playwright/test'
export default defineConfig({
  testDir:'.',testMatch:'raycast.browser.spec.js',fullyParallel:false,workers:1,timeout:45000,
  use:{baseURL:process.env.HARBOR_QA_URL||'http://127.0.0.1:5181',viewport:{width:1440,height:900},browserName:'chromium',headless:true},
  reporter:'list',outputDir:'/tmp/kubeview-harbor-raycast',
})
