import styled from 'styled-components';

export const Frame = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  &.active {
    display: flex;
  }
`;

export const Container = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  min-width: 600px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  color: white;

  h2 {
    margin: 0 0 20px 0;
    color: #f0f0f0;
    text-align: center;
  }

  h3 {
    margin: 20px 0 10px 0;
    color: #e0e0e0;
  }

  h4 {
    margin: 0 0 10px 0;
    color: #d0d0d0;
  }

  p {
    margin: 5px 0;
    color: #c0c0c0;
  }
`;

export const StatusBar = styled.div`
  background: #1a1a1a;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  border-left: 4px solid #4caf50;

  div {
    margin: 5px 0;
    color: #e0e0e0;
  }

  strong {
    color: #4caf50;
  }
`;

export const JobCard = styled.div`
  background: #3a3a3a;
  border-radius: 6px;
  padding: 15px;
  margin: 10px 0;
  border: 1px solid #555;
  transition: all 0.2s ease;

  &:hover {
    background: #404040;
    border-color: #777;
  }

  h4 {
    color: #4caf50;
    margin-bottom: 8px;
  }

  p {
    margin: 5px 0;
    font-size: 14px;
  }
`;

export const Button = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.2s ease;
  margin-top: 10px;

  &:hover {
    background: #45a049;
  }

  &:active {
    background: #3d8b40;
  }

  &.danger {
    background: #f44336;

    &:hover {
      background: #da190b;
    }

    &:active {
      background: #c62828;
    }
  }
`;
