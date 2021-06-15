const now = new Date();
const Footer = () => {
  return (<div className="footer">&copy; {now.getFullYear()} Socket Mobile, inc.<br /> <a href="https://github.com/socketmobile/singleentry-react" rel="noreferrer" target="_blank">see in github</a></div>); ;
}
 
export default Footer;
