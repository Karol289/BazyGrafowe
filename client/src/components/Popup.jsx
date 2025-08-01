
import './Popup.css'

const Popup = ({ openPopup, title, children}) => {
  if (!openPopup) return null;

  return (
    <div className="popup-overlay">
      <div className="popup">
        <div className="popup-header">
          {title}
        </div>
        <div className='popup-children'>
          {children}
        </div>
        {/* <div className="popup-footer">
          {footer}
        </div> */}
      </div>
    </div>
  );
};

export default Popup;