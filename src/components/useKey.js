import {useEffect} from "react";

export function useKey(code, callback) {
  useEffect(function () {
    function callback(e) {
      if(e.code.toLowerCase() === code.toLowerCase()) {
        callback();
      }
    }
    document.addEventListener("keydown", callback);

    return function () {
      document.removeEventListener('keydown', callback);
    }
  }, [callback, code]);
}