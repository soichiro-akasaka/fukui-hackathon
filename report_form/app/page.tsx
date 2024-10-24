import { ExifLocationViewer } from "@/components/exif-location-viewer"
import CompletionScreen from "@/components/completion-screen"
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

export default function Page() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={ExifLocationViewer} />
        <Route path="/completion" component={CompletionScreen} />
      </Switch>
    </Router>
  )
}
