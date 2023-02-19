import { createGetInitialProps } from '@mantine/next';
import { Html, Head, Main, NextScript } from 'next/document';
import styled from '@emotion/styled';

const maxSize = { height: '100%', width: '100%', padding: 0, margin: 0 };

const Body = styled.body`
  div#__next {
    height: 100%;
    width: 100%;
  }

  * {
    box-sizing: border-box;
  }
`;

function Document() {
  return (
    <Html style={maxSize} lang="en">
      <Head />
      <Body style={maxSize}>
        <Main />
        <NextScript />
      </Body>
    </Html>
  );
}

Document.getInitialProps = createGetInitialProps();

export default Document;
