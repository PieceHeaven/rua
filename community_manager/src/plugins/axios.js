"use strict";

import Vue from 'vue';
import axios from "axios";
// import router from "@/router/router";

// Full config:  https://github.com/axios/axios#request-config
// axios.defaults.baseURL = process.env.baseURL || process.env.apiUrl || '';
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

let config = {
  // baseURL: "http://106.14.173.159:8089"
  baseURL:"http://localhost:8089",
  // timeout: 60 * 1000, // Timeout
  // withCredentials: true, // Check cross-site Access-Control

}

const _axios = axios.create(config);
_axios.interceptors.request.use(
  function(config) {
    const token = localStorage.getItem('user_data');
    config.headers.common['Authorization'] = 'Bearer ' + token;
    // Do something before request is sent
    return config;
  },
  function(error) {
    // Do something with request error

    return Promise.reject(error);
  }
);

// Add a response interceptor
_axios.interceptors.response.use(
  function(response) {
    // Do something with response data
    return response;
  },
  function(error) {
    let errMsg = `${error}`
    let errCode = errMsg.substring(errMsg.length-3,errMsg.length)
    let ref = window.location.origin
    if(errCode=='401'){
       console.log('未登陆或者登陆信息已经过期')
       localStorage.setItem('user_data', '');
       location.href = ref+'/#/login'
      // router.push({path: '/login'});
    }else{
      console.log('网络错误')
    }

    // Do something with response error
    return Promise.reject(error);
  }
);

Plugin.install = function(Vue, options) {
  Vue.axios = _axios;
  window.axios = _axios;
  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return _axios;
      }
    },
    $axios: {
      get() {
        return _axios;
      }
    },
  });
};

Vue.use(Plugin)

export default Plugin;
