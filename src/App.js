import { useState, useEffect } from 'react'
import { Stack, Card, Form, Button, ButtonGroup, ToggleButton } from 'react-bootstrap'

import Menu from "./components/Menu"
import TestingZone from "./components/TestingZone"
import ReviewSet from "./components/ReviewSet"
import FinishPage from "./components/FinishPage"

function App() {

  const [given, setGiven] = useState("")
  const [want, setWant] = useState("")
  const [setChoice, setSetChoice] = useState("")

  //to show or not to show each of the pages
  const [showMenu, setShowMenu] = useState(true);
  const [showReviewSet, setShowReviewSet] = useState(true);
  const [showTestingZone, setShowTestingZone] = useState(true);
  const [showFinishPage, setShowFinishPage] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>

      <Stack style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
        {showMenu &&
          <Menu
            given={given}
            setGiven={setGiven}
            want={want}
            setWant={setWant}
            setChoice={setChoice}
            setSetChoice={setSetChoice}
          />}

        {showTestingZone &&
          <TestingZone
            given={given}
            setGiven={setGiven}
            want={want}
            setWant={setWant}
            setChoice={setChoice}
            setSetChoice={setSetChoice}
            showTestingZone={showTestingZone} //this stuff might need to be deleted
            setShowTestingZone={setShowTestingZone}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
          />}

        {showReviewSet &&
          <ReviewSet
            setChoice={setChoice}
            setSetChoice={setSetChoice}
          />}

        {showFinishPage &&
          <FinishPage 
            setChoice={setChoice}
          />}

      </Stack>


      {/* <Container className="w-full h-full">
          <Row>
            <Col xs="6">
              <Card>
                <Card.Img />
                <Card.Body>
                  <Card.Title>
                    Eric Website
                  </Card.Title>
                  <Card.Text>
                    yeah you heard that
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs="6">
              <body>
                Words here
              </body>
            </Col>
          </Row>
        </Container>
        <Alert variant="secondary">This button has been pressed {count} times</Alert>
        <Button onClick={doThing}>Test Button 2</Button>
        <body>the number is {isEven ? 'even' : 'not even'}</body> */}

    </div >
  );
}

export default App;
