import * as alertify from 'alertifyjs'
import { Browser } from 'leaflet'
import animateSvg from 'animate-svg'
import { last } from 'lodash'

import pool from '../ObjectPool'
import { filters } from './svg'
import { ShortestRouteObject } from './algorithm'
import { tryGetFromMap } from './index'
import { byId } from './dom'
import { transitionEnd } from './events'

import { tr, formatTime as ft } from '../i18n'

import {
    Platform,
    Edge,
    Transfer,
    Span,
} from '../network'
