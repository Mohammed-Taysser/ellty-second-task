import { MAIN_FONT } from '../configs/theme.config';
import {
  App as AntDesignApp,
  ConfigProvider
} from 'antd';
import { type PropsWithChildren } from 'react';

function AntDesignProvider(props: Readonly<PropsWithChildren>) {
  const { children } = props;

 

  return (
    <ConfigProvider
 
      theme={{
     
        token: {
      
          fontFamily: MAIN_FONT,

         },
        components: {
          Typography: {
            fontFamily: MAIN_FONT,
          },
 
        },
      }}
    >
      <AntDesignApp>{children}</AntDesignApp>
    </ConfigProvider>
  );
}

export default AntDesignProvider;
