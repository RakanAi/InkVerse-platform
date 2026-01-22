import { Container, Row} from "react-bootstrap"

export default function Banner () {
    return(
        <section className="banner flex" id="home">
            <Row className="align-item-center">
                <h1>Welcome to Inkverse!</h1>
            </Row>
        </section>
    );
}