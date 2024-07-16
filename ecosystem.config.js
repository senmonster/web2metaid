module.exports = {
  apps: [
    {
      name: 'server-web2metaid', // 应用名称
      script: 'dist/index.js', // 启动脚本
      watch: true, // 是否监视文件变化
      ignore_watch: ['logs', 'node_modules'],
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'tsc', // TypeScript 编译器
      script: 'tsc',
      args: '-w', // 传递给脚本的参数
      interpreter: 'none', // 不使用解释器
      watch: false, // 不监视文件变化
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
