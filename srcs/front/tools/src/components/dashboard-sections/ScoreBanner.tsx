import { useEffect, useState } from "react";
import { UserInter } from "../../interfaces/UserInterfaces";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { MdOutlineVerified } from "react-icons/md";
import { UserDataInter } from "../../interfaces/UserInterfaces";


export function ScoreBanner({
  user,
  user_data,
}: {
  user: UserInter | null;
  user_data: UserDataInter | null;
}): JSX.Element {
	