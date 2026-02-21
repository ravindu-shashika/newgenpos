import React from 'react';
import { SafeFontAwesomeIcon } from '.';
import {
  faPlus,
  faSave,
  faTimes,
  faRedoAlt,
  faPlusCircle,
  faTimesCircle,
  faSyncAlt,
  faPrint,
  faAngleUp,
  faAngleDown,
  faSearch,
  faTrashAlt,
  faTrash,
  faPlayCircle,
  faMoneyBillWaveAlt,
  faCheckCircle,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faEllipsisH,
} from '@fortawesome/free-solid-svg-icons';

/**
 * * collapseState prop here is only used in the collapse buttons
 */

const SystemButton = ({
  type,
  method,
  collapseState,
  btnText,
  showText,
  classes,
  disabled,
}) => {
  const SysButton = () => {
    switch (type) {
      case 'add-new':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-info btn-block btn-sm shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faPlus} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Add New'}
              </span>
            ) : null}
          </button>
        );

      case 'option-row':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-info btn-block btn-sm shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faEllipsisH} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Add New'}
              </span>
            ) : null}
          </button>
        );

      case 'save':
        return (
          <button
            type="submit"
            className={
              classes ? classes : 'btn btn-success btn-block btn-sm  shadow-sm'
            }
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faSave} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Save Changes'}
              </span>
            ) : null}
          </button>
        );

      case 'update':
        return (
          <button
            type="submit"
            className={
              classes ? classes : 'btn btn-success btn-block btn-sm  shadow-sm'
            }
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faSave} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Update'}
              </span>
            ) : null}
          </button>
        );

      case 'no-form-save':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-success btn-block btn-sm shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faSave} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;&nbsp;&nbsp;
                {btnText ? btnText : 'Save Changes'}
              </span>
            ) : null}
          </button>
        );

      case 'close':
        return (
          <button
            type="button"
            className={
              classes
                ? classes
                : 'btn btn-danger btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faTimes} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;&nbsp;&nbsp;
                {btnText ? btnText : 'Close'}
              </span>
            ) : null}
          </button>
        );

      case 'reset':
        return (
          <button
            type="button"
            className={
              classes
                ? classes
                : 'btn btn-outline-danger btn-block btn-sm shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faRedoAlt} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;&nbsp;&nbsp;
                {btnText ? btnText : 'Reset'}
              </span>
            ) : null}
          </button>
        );

      case 'print':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-primary btn-block btn-sm shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faPrint} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;&nbsp;&nbsp;
                {btnText ? btnText : 'Print'}
              </span>
            ) : null}
          </button>
        );

      case 'add-row':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-info btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faPlusCircle} />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : null}
              </span>
            ) : null}
          </button>
        );

      case 'add-row-more':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-info btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faPlusCircle} />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Add More'}
              </span>
            ) : null}
          </button>
        );

      case 'remove-row':
        return (
          <button
            type="button"
            className={
              classes
                ? classes
                : 'btn btn-outline-danger btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faTimesCircle} />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : null}
              </span>
            ) : null}
          </button>
        );

      case 'load':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-info btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faSyncAlt} />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Load Data'}
              </span>
            ) : null}
            &nbsp;
          </button>
        );

      case 'search2':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-info btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faSearch} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;&nbsp;
                {btnText ? btnText : 'Search'}
              </span>
            ) : null}
            &nbsp;
          </button>
        );

      case 'section-toggle':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-hide btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            {collapseState === true ? (
              <SafeFontAwesomeIcon icon={faAngleUp} />
            ) : (
              <SafeFontAwesomeIcon icon={faAngleDown} />
            )}
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Toggle'}
              </span>
            ) : null}
          </button>
        );

      case 'section-toggle-2':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-warning btn-block btn-sm  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            {showText ? (
              <span>
                {btnText ? btnText : 'Toggle'}
                &nbsp; &nbsp; &nbsp;
              </span>
            ) : null}
            {collapseState === true ? (
              <SafeFontAwesomeIcon icon={faAngleDoubleRight} />
            ) : (
              <SafeFontAwesomeIcon icon={faAngleDoubleLeft} />
            )}
          </button>
        );

      case 'search':
        return (
          <button
            type="submit"
            className={
              classes ? classes : 'btn btn-success btn-block btn-sm  shadow-sm'
            }
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faSearch} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Search'}
              </span>
            ) : null}
          </button>
        );

      case 'delete':
        return (
          <button
            type="button"
            className={
              classes
                ? classes
                : 'btn btn-sm btn-danger btn-block  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faTrashAlt} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Delete'}
              </span>
            ) : null}
          </button>
        );

      case 'cancel':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-sm btn-warning btn-block  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faTimes} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Cancel'}
              </span>
            ) : null}
          </button>
        );

      case 'payment':
        return (
          <button
            type="button"
            className={
              classes
                ? classes
                : 'btn btn-sm btn-secondary btn-block  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faMoneyBillWaveAlt} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;&nbsp;&nbsp;
                {btnText ? btnText : 'Payment'}
              </span>
            ) : null}
          </button>
        );

      case 'start':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-sm btn-success btn-block  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faPlayCircle} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Start'}
              </span>
            ) : null}
          </button>
        );

        case 'view':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-sm btn-success btn-block  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'View'}
              </span>
            ) : null}
          </button>
        );

      case 'approve':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-sm btn-info btn-block  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            <span>
              <SafeFontAwesomeIcon icon={faCheckCircle} size="sm" />
            </span>
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Approve'}
              </span>
            ) : null}
          </button>
        );

        case 'reserve-tag':
        return (
          <button
            type="button"
            className={
              classes ? classes : 'btn btn-sm btn-info btn-block  shadow-sm'
            }
            onClick={() => method()}
            disabled={disabled ? true : false}
          >
            {showText ? (
              <span>
                &nbsp;
                {btnText ? btnText : 'Approve'}
              </span>
            ) : null}
          </button>
        );

      default:
        break;
    }
  };

  return (
    <div>
      <SysButton />
    </div>
  );
};

export default SystemButton;
