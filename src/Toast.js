import styled from 'styled-components';

export default styled.div`
  display: flex;
  width: 100%;
  max-width: 100%;
  min-height: 56px;
  padding: 16px;
  word-break: break-all;
  word-break: break-word;
  border-radius: 8px;
  background: #fff;
  cursor: initial;
  user-select: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

  @media (min-width: 500px) {
    width: 304px;
  }
`;
